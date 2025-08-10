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
      const chainIds = SUPPORTED_CHAINS.map(c => c.id)
      const pairs = await dexScreenerService.fetchUsdtPairsForChains(chainIds)

      // Sort by a proxy for importance, e.g., price
      pairs.sort((a, b) => b.priceUsd - a.priceUsd)

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
