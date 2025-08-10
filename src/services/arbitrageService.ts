import { ArbitrageOpportunity, Token, Chain, PriceData } from '../types'
import { SUPPORTED_CHAINS, SUPPORTED_DEXS } from '../data/chains'
import dexScreenerService, { DexScreenerPairRow } from './dexScreenerService'
import priceService from './priceService'

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
      // 1. Discover pairs for the token using DexScreener
      const pairs = await dexScreenerService.fetchDexScreenerPairsByTokenAddress(options.tokenAddress)
      if (!pairs || pairs.length === 0) {
        return { opportunities: [], scanTime: Date.now() - startTime }
      }

      // 2. Group pairs by chain
      const pairsByChain: Record<string, DexScreenerPairRow[]> = {}
      for (const pair of pairs) {
        if (!pairsByChain[pair.chainId]) {
          pairsByChain[pair.chainId] = []
        }
        pairsByChain[pair.chainId].push(pair)
      }

      // 3. For each chain, find arbitrage opportunities
      const allOpportunities: ArbitrageOpportunity[] = []
      for (const chainId in pairsByChain) {
        if (options.selectedChains && !options.selectedChains.includes(chainId)) {
          continue
        }
        const chainOpportunities = await this.findArbitrageOnChain(
          chainId,
          pairsByChain[chainId],
          options.tradeSizeUSD
        )
        allOpportunities.push(...chainOpportunities)
      }

      // 4. Sort by net profit
      allOpportunities.sort((a, b) => b.netProfit - a.netProfit)

      return {
        opportunities: allOpportunities,
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

  private async findArbitrageOnChain(
    chainId: string,
    pairs: DexScreenerPairRow[],
    tradeSizeUSD: number
  ): Promise<ArbitrageOpportunity[]> {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId)
    if (!chain) return []

    const stablecoin = STABLECOINS[chainId]
    if (!stablecoin) return []

    const nativePriceUSD = await this.getNativePriceUSD(chain)
    if (!nativePriceUSD) return []

    const gasPriceGwei = await priceService.getGasPrice(chain)

    // Get all supported DEXs on this chain that are present in the pairs
    const dexIdsInPairs = new Set(pairs.map(p => p.dexId))
    const dexsOnChain = SUPPORTED_DEXS.filter(d => d.chain === chainId && dexIdsInPairs.has(d.id))
    if (dexsOnChain.length < 2) return []

    const opportunities: ArbitrageOpportunity[] = []

    // This is O(n^2) on the number of DEXs, which is fine for this use case.
    for (let i = 0; i < dexsOnChain.length; i++) {
      for (let j = 0; j < dexsOnChain.length; j++) {
        if (i === j) continue

        const buyDEX = dexsOnChain[i]
        const sellDEX = dexsOnChain[j]

        const baseTokenInfo = pairs[0].baseToken
        const token: Token = {
          address: baseTokenInfo.address,
          name: baseTokenInfo.name,
          symbol: baseTokenInfo.symbol,
          decimals: 18, // This is a big assumption, would need to be fetched for accuracy
          logoURI: `https://tokens.1inch.io/${baseTokenInfo.address}.png`
        }

        const stableToken: Token = {
          address: stablecoin.address,
          name: 'Stablecoin',
          symbol: 'USDT', // Assuming USDT for simplicity
          decimals: stablecoin.decimals
        }

        // Get quote: Trade USD -> Token on Buy DEX
        const buyQuote = await priceService.getQuote(tradeSizeUSD, stableToken, token, buyDEX, chain)
        if (!buyQuote) continue

        const amountOfTokenToSell = buyQuote.amountOut

        // Get quote: Trade Token -> USD on Sell DEX
        const amountReceived = await priceService.getQuoteForAmountIn(
          amountOfTokenToSell,
          token,
          stableToken,
          sellDEX,
          chain
        )
        if (!amountReceived) continue

        const amountSpentUSD = tradeSizeUSD
        const amountReceivedUSD = parseFloat(ethers.formatUnits(amountReceived, stablecoin.decimals))

        const grossProfit = amountReceivedUSD - amountSpentUSD
        if (grossProfit <= 0) continue

        // Re-calculate price for the sell side based on the actual quote
        const sellPrice = amountReceivedUSD / parseFloat(ethers.formatUnits(amountOfTokenToSell, token.decimals))

        // Fee Calculation
        const tradingFees = (tradeSizeUSD * buyDEX.tradingFee) + (amountReceivedUSD * sellDEX.tradingFee)
        const gasCostUSD = await this.estimateGasCost(chain, gasPriceGwei, nativePriceUSD)
        const totalCosts = tradingFees + gasCostUSD

        const netProfit = grossProfit - totalCosts
        if (netProfit <= 0) continue

        const priceDataBuy: PriceData = {
          dex: buyDEX,
          token,
          price: buyQuote.price,
          priceUSD: buyQuote.priceUSD,
          liquidity: 0, volume24h: 0, lastUpdated: new Date()
        }

        const priceDataSell: PriceData = {
          dex: sellDEX,
          token,
          price: sellPrice,
          priceUSD: sellPrice, // Assuming stablecoin is 1:1 with USD
          liquidity: 0, volume24h: 0, lastUpdated: new Date()
        }

        opportunities.push({
          id: `${token.address}-${buyDEX.id}-${sellDEX.id}`,
          token,
          buyDEX: priceDataBuy,
          sellDEX: priceDataSell,
          priceDifference: priceDataSell.priceUSD - priceDataBuy.priceUSD,
          priceDifferencePercent: ((priceDataSell.priceUSD - priceDataBuy.priceUSD) / priceDataBuy.priceUSD) * 100,
          estimatedCosts: {
            buyGasFee: gasCostUSD / 2,
            sellGasFee: gasCostUSD / 2,
            bridgeFee: 0,
            tradingFees: tradingFees,
            totalCosts: totalCosts
          },
          netProfit: netProfit,
          netProfitPercent: (netProfit / tradeSizeUSD) * 100,
          isCrossChain: false,
          riskLevel: netProfit > 20 ? 'low' : netProfit > 5 ? 'medium' : 'high',
          lastUpdated: new Date()
        })
      }
    }
    return opportunities
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
