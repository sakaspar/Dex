import axios from 'axios'
import { ethers } from 'ethers'
import { Token, PriceData, DEX, Chain } from '../types'

// Price aggregator APIs
const COINGECKO_API = 'https://api.coingecko.com/api/v3'
const COINMARKETCAP_API = 'https://pro-api.coinmarketcap.com/v1'

// DEX subgraph endpoints
const UNISWAP_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
const SUSHISWAP_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange'

export interface PriceFetchResult {
  success: boolean
  data?: PriceData
  error?: string
  source: string
}

export class PriceService {
  private static instance: PriceService
  private cache: Map<string, { data: PriceData; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 30000 // 30 seconds

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService()
    }
    return PriceService.instance
  }

  async getTokenPrice(
    token: Token,
    dex: DEX,
    chain: Chain
  ): Promise<PriceFetchResult> {
    const cacheKey = `${token.address}-${dex.id}-${chain.id}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return {
        success: true,
        data: cached.data,
        source: 'cache'
      }
    }

    try {
      // Try DEX-specific price first
      const dexPrice = await this.fetchDEXPrice(token, dex, chain)
      if (dexPrice.success && dexPrice.data) {
        this.cache.set(cacheKey, {
          data: dexPrice.data,
          timestamp: Date.now()
        })
        return dexPrice
      }

      // Fallback to aggregator APIs
      const aggregatorPrice = await this.fetchAggregatorPrice(token, chain)
      if (aggregatorPrice.success && aggregatorPrice.data) {
        // Create a mock DEX price structure for aggregator data
        const mockDexPrice: PriceData = {
          dex,
          token,
          price: aggregatorPrice.data.price,
          priceUSD: aggregatorPrice.data.priceUSD,
          liquidity: 0, // Not available from aggregator
          volume24h: 0, // Not available from aggregator
          lastUpdated: new Date()
        }
        
        this.cache.set(cacheKey, {
          data: mockDexPrice,
          timestamp: Date.now()
        })
        
        return {
          success: true,
          data: mockDexPrice,
          source: 'aggregator'
        }
      }

      return {
        success: false,
        error: 'Failed to fetch price from all sources',
        source: 'none'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error'
      }
    }
  }

  private async fetchDEXPrice(
    token: Token,
    dex: DEX,
    chain: Chain
  ): Promise<PriceFetchResult> {
    try {
      switch (dex.id) {
        case 'uniswap-v3':
          return await this.fetchUniswapV3Price(token, dex, chain)
        case 'sushiswap':
          return await this.fetchSushiSwapPrice(token, dex, chain)
        case 'pancakeswap':
          return await this.fetchPancakeSwapPrice(token, dex, chain)
        default:
          return {
            success: false,
            error: `Unsupported DEX: ${dex.id}`,
            source: 'dex'
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DEX fetch error',
        source: 'dex'
      }
    }
  }

  private async fetchUniswapV3Price(
    token: Token,
    dex: DEX,
    chain: Chain
  ): Promise<PriceFetchResult> {
    try {
      // Query Uniswap V3 subgraph for pool data
      const query = `
        query {
          pools(
            where: {
              token0: "${token.address.toLowerCase()}"
              token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" # WETH
            }
            orderBy: totalValueLockedUSD
            orderDirection: desc
            first: 1
          ) {
            id
            token0Price
            token1Price
            totalValueLockedUSD
            volumeUSD
          }
        }
      `

      const response = await axios.post(UNISWAP_SUBGRAPH, { query })
      const pools = response.data?.data?.pools

      if (pools && pools.length > 0) {
        const pool = pools[0]
        const price = parseFloat(pool.token0Price)
        const priceUSD = price * 1850 // Approximate ETH price

        return {
          success: true,
          data: {
            dex,
            token,
            price,
            priceUSD,
            liquidity: parseFloat(pool.totalValueLockedUSD),
            volume24h: parseFloat(pool.volumeUSD),
            lastUpdated: new Date()
          },
          source: 'uniswap-v3'
        }
      }

      return {
        success: false,
        error: 'No pools found',
        source: 'uniswap-v3'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Uniswap V3 error',
        source: 'uniswap-v3'
      }
    }
  }

  private async fetchSushiSwapPrice(
    token: Token,
    dex: DEX,
    chain: Chain
  ): Promise<PriceFetchResult> {
    try {
      // Query SushiSwap subgraph for pair data
      const query = `
        query {
          pairs(
            where: {
              token0: "${token.address.toLowerCase()}"
              token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" # WETH
            }
            orderBy: reserveUSD
            orderDirection: desc
            first: 1
          ) {
            id
            token0Price
            token1Price
            reserveUSD
            volumeUSD
          }
        }
      `

      const response = await axios.post(SUSHISWAP_SUBGRAPH, { query })
      const pairs = response.data?.data?.pairs

      if (pairs && pairs.length > 0) {
        const pair = pairs[0]
        const price = parseFloat(pair.token0Price)
        const priceUSD = price * 1850 // Approximate ETH price

        return {
          success: true,
          data: {
            dex,
            token,
            price,
            priceUSD,
            liquidity: parseFloat(pair.reserveUSD),
            volume24h: parseFloat(pair.volumeUSD),
            lastUpdated: new Date()
          },
          source: 'sushiswap'
        }
      }

      return {
        success: false,
        error: 'No pairs found',
        source: 'sushiswap'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SushiSwap error',
        source: 'sushiswap'
      }
    }
  }

  private async fetchPancakeSwapPrice(
    token: Token,
    dex: DEX,
    chain: Chain
  ): Promise<PriceFetchResult> {
    // PancakeSwap doesn't have a public subgraph, so we'll use aggregator
    return {
      success: false,
      error: 'PancakeSwap price fetching not implemented',
      source: 'pancakeswap'
    }
  }

  private async fetchAggregatorPrice(
    token: Token,
    chain: Chain
  ): Promise<PriceFetchResult> {
    try {
      // Try CoinGecko first (free tier)
      const coingeckoId = this.getCoinGeckoId(token.symbol)
      if (coingeckoId) {
        const response = await axios.get(
          `${COINGECKO_API}/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_vol=true`
        )
        
        if (response.data[coingeckoId]) {
          const data = response.data[coingeckoId]
          return {
            success: true,
            data: {
              dex: {} as DEX, // Will be filled by caller
              token,
              price: data.usd,
              priceUSD: data.usd,
              liquidity: 0,
              volume24h: data.usd_24h_vol || 0,
              lastUpdated: new Date()
            },
            source: 'coingecko'
          }
        }
      }

      return {
        success: false,
        error: 'No aggregator price available',
        source: 'aggregator'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Aggregator error',
        source: 'aggregator'
      }
    }
  }

  private getCoinGeckoId(symbol: string): string | null {
    const mapping: { [key: string]: string } = {
      'ETH': 'ethereum',
      'UNI': 'uniswap',
      'DAI': 'dai',
      'WETH': 'weth',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'WBTC': 'wrapped-bitcoin'
    }
    return mapping[symbol.toUpperCase()] || null
  }

  async getGasPrice(chain: Chain): Promise<number> {
    try {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrls[0])
      const gasPrice = await provider.getFeeData()
      return Number(ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'))
    } catch (error) {
      console.error('Failed to fetch gas price:', error)
      return 25 // Default fallback
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export default PriceService
