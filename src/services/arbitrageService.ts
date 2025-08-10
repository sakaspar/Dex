import { ArbitrageOpportunity, Token, Chain, PriceData } from '../types'
import { SUPPORTED_CHAINS, SUPPORTED_DEXS } from '../data/chains'
import dexScreenerService, { DexScreenerPairRow } from './dexScreenerService'
import priceService from './priceService'
import { MOCK_ARBITRAGE_OPPORTUNITIES } from '../data/mockData'

export interface ScanOptions {
  tokenAddress: string
  tradeSizeUSD: number
  selectedChains?: string[]
}

export interface ScanResult {
  opportunities: ArbitrageOpportunity[]
  scanTime: number
  error?: string
}

// Main stablecoin addresses, keyed by chain ID - should match priceService
const STABLECOINS: Record<string, { address: string; decimals: number }> = {
  ethereum: { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 }, // USDT
  bsc: { address: '0x55d398326f99059ff775485246999027b3197955', decimals: 18 }, // BUSD-T
  polygon: { address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', decimals: 6 }, // USDT
  arbitrum: { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6 }, // USDT
  avalanche: { address: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', decimals: 6 }, // USDT
  fantom: { address: '0x049d68029688eabf473097a2fc38ef61633a3c7a', decimals: 6 } // fUSDT
}

class ArbitrageService {
  private isScanning = false

  async scanForOpportunities(options: ScanOptions): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error('A scan is already in progress.')
    }
    this.isScanning = true

    const startTime = Date.now()
    try {
      console.log('Starting arbitrage scan for token:', options.tokenAddress)
      
      // 1. Get market data for all tokens to find opportunities
      const chainIds = options.selectedChains || SUPPORTED_CHAINS.map(c => c.id)
      const marketData = await dexScreenerService.fetchUsdtPairsForChains(chainIds)
      
      if (!marketData || marketData.length === 0) {
        console.log('No market data available')
        return { opportunities: [], scanTime: Date.now() - startTime }
      }

      // 2. Find the specific token in the market data
      const tokenPairs = marketData.filter(pair => 
        pair.baseToken.address.toLowerCase() === options.tokenAddress.toLowerCase() ||
        pair.baseToken.symbol.toLowerCase() === options.tokenAddress.toLowerCase()
      )

      if (tokenPairs.length === 0) {
        console.log('Token not found in market data, trying direct fetch...')
        const directPairs = await dexScreenerService.fetchDexScreenerPairsByTokenAddress(options.tokenAddress)
        if (directPairs.length > 0) {
          tokenPairs.push(...directPairs)
        }
      }

      if (tokenPairs.length === 0) {
        return { opportunities: [], scanTime: Date.now() - startTime }
      }

      // 3. Generate arbitrage opportunities from the pairs
      const opportunities = this.generateArbitrageOpportunities(tokenPairs, options.tradeSizeUSD)
      
      console.log(`Found ${opportunities.length} arbitrage opportunities`)

      return {
        opportunities: opportunities,
        scanTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('Error during arbitrage scan:', error)
      return {
        opportunities: [],
        scanTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    } finally {
      this.isScanning = false
    }
  }

  private generateArbitrageOpportunities(pairs: DexScreenerPairRow[], tradeSizeUSD: number): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = []
    
    // Group pairs by chain
    const pairsByChain: Record<string, DexScreenerPairRow[]> = {}
    for (const pair of pairs) {
      if (!pairsByChain[pair.chainId]) {
        pairsByChain[pair.chainId] = []
      }
      pairsByChain[pair.chainId].push(pair)
    }

    // For each chain, find arbitrage opportunities between DEXs
    for (const chainId in pairsByChain) {
      const chainPairs = pairsByChain[chainId]
      if (chainPairs.length < 2) continue

      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId)
      if (!chain) continue

      // Find DEXs that have this token
      const dexPairs = new Map<string, DexScreenerPairRow>()
      for (const pair of chainPairs) {
        const dex = SUPPORTED_DEXS.find(d => d.id === pair.dexId)
        if (dex) {
          dexPairs.set(dex.id, pair)
        }
      }

      const dexIds = Array.from(dexPairs.keys())
      
      // Generate opportunities between different DEXs
      for (let i = 0; i < dexIds.length; i++) {
        for (let j = 0; j < dexIds.length; j++) {
          if (i === j) continue

          const buyDexId = dexIds[i]
          const sellDexId = dexIds[j]
          const buyPair = dexPairs.get(buyDexId)!
          const sellPair = dexPairs.get(sellDexId)!

          const buyDex = SUPPORTED_DEXS.find(d => d.id === buyDexId)!
          const sellDex = SUPPORTED_DEXS.find(d => d.id === sellDexId)!

          // Calculate price difference
          const buyPrice = buyPair.priceUsd
          const sellPrice = sellPair.priceUsd
          const priceDifference = sellPrice - buyPrice
          const priceDifferencePercent = (priceDifference / buyPrice) * 100

          // Only consider profitable opportunities
          if (priceDifference <= 0) continue

          // Calculate costs
          const tradingFees = (tradeSizeUSD * buyDex.tradingFee) + (tradeSizeUSD * sellDex.tradingFee)
          const gasCostUSD = this.estimateGasCostSimple(chainId)
          const totalCosts = tradingFees + gasCostUSD

          // Calculate profit
          const grossProfit = (priceDifference / buyPrice) * tradeSizeUSD
          const netProfit = grossProfit - totalCosts

          // Only show profitable opportunities
          if (netProfit <= 0) continue

          const token: Token = {
            address: buyPair.baseToken.address,
            name: buyPair.baseToken.name,
            symbol: buyPair.baseToken.symbol,
            decimals: 18,
            logoURI: `https://tokens.1inch.io/${buyPair.baseToken.address}.png`
          }

          const priceDataBuy: PriceData = {
            dex: buyDex,
            token,
            price: buyPrice,
            priceUSD: buyPrice,
            liquidity: 0,
            volume24h: 0,
            lastUpdated: new Date()
          }

          const priceDataSell: PriceData = {
            dex: sellDex,
            token,
            price: sellPrice,
            priceUSD: sellPrice,
            liquidity: 0,
            volume24h: 0,
            lastUpdated: new Date()
          }

          opportunities.push({
            id: `${token.address}-${buyDex.id}-${sellDex.id}`,
            token,
            buyDEX: priceDataBuy,
            sellDEX: priceDataSell,
            priceDifference,
            priceDifferencePercent,
            estimatedCosts: {
              buyGasFee: gasCostUSD / 2,
              sellGasFee: gasCostUSD / 2,
              bridgeFee: 0,
              tradingFees,
              totalCosts
            },
            netProfit,
            netProfitPercent: (netProfit / tradeSizeUSD) * 100,
            isCrossChain: false,
            riskLevel: netProfit > 20 ? 'low' : netProfit > 5 ? 'medium' : 'high',
            lastUpdated: new Date()
          })
        }
      }
    }

    return opportunities.sort((a, b) => b.netProfit - a.netProfit)
  }

  private estimateGasCostSimple(chainId: string): number {
    const gasCosts: Record<string, number> = {
      ethereum: 50,
      bsc: 5,
      polygon: 2,
      arbitrum: 15,
      avalanche: 8,
      fantom: 3
    }
    return gasCosts[chainId] || 10
  }

  private async estimateGasCost(chain: Chain, gasPriceGwei: number, nativePriceUSD: number): Promise<number> {
    const gasPerSwap: Record<string, number> = {
      ethereum: 150_000,
      bsc: 120_000,
      polygon: 120_000,
      arbitrum: 250_000,
      avalanche: 180_000,
      fantom: 150_000
    }
    const gasLimit = gasPerSwap[chain.id] || 200_000
    // Cost for two swaps (buy and sell)
    const totalGasCost = (gasPriceGwei * 1e-9) * gasLimit * nativePriceUSD * 2
    return totalGasCost
  }

  private async getNativePriceUSD(chain: Chain): Promise<number | null> {
    const symbolMap: Record<string, string> = {
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'FTM': 'fantom'
    }
    const coingeckoId = symbolMap[chain.nativeCurrency.symbol]
    if (!coingeckoId) return null
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
      const resp = await fetch(url)
      const data = await resp.json()
      return data[coingeckoId]?.usd || null
    } catch (e) {
      console.error('Failed to fetch native price from coingecko', e)
      return null
    }
  }

  getSupportedChains(): Chain[] {
    return SUPPORTED_CHAINS
  }

  getSupportedDEXs() {
    return SUPPORTED_DEXS
  }
}

export const arbitrageService = new ArbitrageService()
export default arbitrageService
