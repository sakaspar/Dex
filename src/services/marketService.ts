import { DexScreenerPairRow } from './dexScreenerService'
import dexScreenerService from './dexScreenerService'
import { SUPPORTED_CHAINS } from '../data/chains'

export interface MarketDataRow extends DexScreenerPairRow {
  // We can extend this with more data later if needed
}

interface MarketDataCache {
  data: MarketDataRow[]
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class MarketService {
  private cache: MarketDataCache | null = null

  async getMarketData(forceRefresh: boolean = false): Promise<MarketDataRow[]> {
    if (!forceRefresh && this.cache && (Date.now() - this.cache.timestamp < CACHE_DURATION)) {
      return this.cache.data
    }

    try {
      console.log('Fetching real-time market data from DEXs...')
      const chainIds = SUPPORTED_CHAINS.map(c => c.id)
      
      // Try the enhanced fetching method first
      let pairs = await dexScreenerService.fetchUsdtPairsForChains(chainIds)
      
      // If we didn't get enough data, try the direct method
      if (pairs.length < 10) {
        console.log('Trying direct DEX fetching...')
        const directPairs = await dexScreenerService.fetchDirectFromDexs()
        pairs = [...pairs, ...directPairs]
      }

      // Filter for supported chains
      pairs = pairs.filter(pair => chainIds.includes(pair.chainId))

      // Sort by price (highest first)
      pairs.sort((a, b) => b.priceUsd - a.priceUsd)

      console.log(`Successfully fetched ${pairs.length} real-time pairs`)

      this.cache = {
        data: pairs,
        timestamp: Date.now()
      }

      return pairs
    } catch (error) {
      console.error('Failed to fetch market data:', error)
      return []
    }
  }
}

export const marketService = new MarketService()
export default marketService
