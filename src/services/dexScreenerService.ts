import axios from 'axios'

export interface DexScreenerPairRow {
  chainId: string
  dexId: string
  priceUsd: number
  baseToken: { address: string; symbol: string; name: string }
  quoteToken: { address: string; symbol: string; name: string }
}

export interface DexScreenerTokenResponse {
  pairs?: Array<{
    chainId?: string
    dexId?: string
    priceUsd?: string
    baseToken?: { address?: string; symbol?: string; name?: string }
    quoteToken?: { address: string; symbol: string; name: string }
  }>
}

export interface DexScreenerSearchResponse {
  pairs?: Array<{
    chainId?: string
    dexId?: string
    priceUsd?: string
    baseToken?: { address?: string; symbol?: string; name?: string }
    quoteToken?: { address: string; symbol: string; name: string }
  }>
}

// Enhanced token lists for better coverage
const ETHEREUM_TOKENS = [
  'WETH', 'UNI', 'LINK', 'WBTC', 'AAVE', 'CRV', 'COMP', 'SUSHI', 'MKR', 'SNX', 'YFI', 'BAL', 'REN', 'ZRX',
  'BAND', 'NMR', 'UMA', 'PERP', 'ALPHA', 'BADGER', 'FARM', 'PICKLE', 'CREAM', 'ALCX', 'SPELL', 'MIM',
  'FRAX', 'FEI', 'RARI', 'SUPER', 'DYDX', 'ENS', 'IMX', 'OP', 'ARB', 'PEPE', 'BLUR', 'LDO', 'LPT', 'LQTY',
  'MASK', 'MINA', 'MLN', 'OCEAN', 'OGN', 'PAXG', 'POLS', 'POND', 'PUNDIX', 'QNT', 'RAD', 'RARE', 'RLC',
  'RSR', 'SAND', 'SKL', 'SLP', 'SNT', 'STX', 'SUKU', 'SXP', 'TRIBE', 'TRU', 'UFO', 'UNFI', 'USDP', 'VGX',
  'WOO', 'YGG', 'BAT', 'ZEN', 'SC', 'HOT', 'NANO', 'ICX', 'WAVES', 'OMG', 'KNC', 'REP', 'GNT', 'STORJ',
  'MANA', 'ENJ', 'CHZ', 'ANKR', 'CKB', 'COTI', 'CTSI', 'DUSK', 'FET', 'FLOW', 'FORTH', 'GHST', 'GTC',
  'HIGH', 'HOPR', 'ILV', 'INJ', 'KEEP', 'NMR'
]

const BSC_TOKENS = [
  'WBNB', 'CAKE', 'BUSD', 'USDT', 'USDC', 'DAI', 'BTCB', 'ETH', 'ADA', 'DOT', 'LINK', 'LTC', 'BCH',
  'XRP', 'EOS', 'TRX', 'XLM', 'VET', 'FIL', 'ATOM', 'NEO', 'QTUM', 'IOTA', 'XTZ', 'THETA', 'ONT', 'ZIL',
  'BAT', 'ZEN', 'SC', 'HOT', 'NANO', 'ICX', 'WAVES', 'OMG', 'KNC', 'REP', 'GNT', 'STORJ', 'MANA', 'ENJ',
  'CHZ', 'ANKR', 'CKB', 'COTI', 'CTSI', 'DUSK', 'FET', 'FLOW', 'FORTH', 'GHST', 'GTC', 'HIGH', 'HOPR',
  'ILV', 'INJ', 'KEEP', 'LDO', 'LPT', 'LQTY', 'MASK', 'MINA', 'MLN', 'OCEAN', 'OGN', 'PAXG', 'POLS',
  'POND', 'PUNDIX', 'QNT', 'RAD', 'RARE', 'RLC', 'RSR', 'SAND', 'SKL', 'SLP', 'SNT', 'STX', 'SUKU',
  'SXP', 'TRIBE', 'TRU', 'UFO', 'UNFI', 'USDP', 'VGX', 'WOO', 'YGG'
]

const POLYGON_TOKENS = [
  'WMATIC', 'MATIC', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'COMP',
  'SUSHI', 'MKR', 'SNX', 'YFI', 'BAL', 'REN', 'ZRX', 'BAND', 'NMR', 'UMA', 'PERP', 'ALPHA', 'BADGER',
  'FARM', 'PICKLE', 'CREAM', 'ALCX', 'SPELL', 'MIM', 'FRAX', 'FEI', 'RARI', 'SUPER', 'DYDX', 'ENS',
  'IMX', 'OP', 'ARB', 'PEPE', 'BLUR', 'LDO', 'LPT', 'LQTY', 'MASK', 'MINA', 'MLN', 'OCEAN', 'OGN',
  'PAXG', 'POLS', 'POND', 'PUNDIX', 'QNT', 'RAD', 'RARE', 'RLC', 'RSR', 'SAND', 'SKL', 'SLP', 'SNT',
  'STX', 'SUKU', 'SXP', 'TRIBE', 'TRU', 'UFO', 'UNFI', 'USDP', 'VGX', 'WOO', 'YGG'
]

const AVALANCHE_TOKENS = [
  'WAVAX', 'AVAX', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'COMP',
  'SUSHI', 'MKR', 'SNX', 'YFI', 'BAL', 'REN', 'ZRX', 'BAND', 'NMR', 'UMA', 'PERP', 'ALPHA', 'BADGER',
  'FARM', 'PICKLE', 'CREAM', 'ALCX', 'SPELL', 'MIM', 'FRAX', 'FEI', 'RARI', 'SUPER', 'DYDX', 'ENS',
  'IMX', 'OP', 'ARB', 'PEPE', 'BLUR', 'LDO', 'LPT', 'LQTY', 'MASK', 'MINA', 'MLN', 'OCEAN', 'OGN',
  'PAXG', 'POLS', 'POND', 'PUNDIX', 'QNT', 'RAD', 'RARE', 'RLC', 'RSR', 'SAND', 'SKL', 'SLP', 'SNT',
  'STX', 'SUKU', 'SXP', 'TRIBE', 'TRU', 'UFO', 'UNFI', 'USDP', 'VGX', 'WOO', 'YGG'
]

const FANTOM_TOKENS = [
  'WFTM', 'FTM', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'COMP',
  'SUSHI', 'MKR', 'SNX', 'YFI', 'BAL', 'REN', 'ZRX', 'BAND', 'NMR', 'UMA', 'PERP', 'ALPHA', 'BADGER',
  'FARM', 'PICKLE', 'CREAM', 'ALCX', 'SPELL', 'MIM', 'FRAX', 'FEI', 'RARI', 'SUPER', 'DYDX', 'ENS',
  'IMX', 'OP', 'ARB', 'PEPE', 'BLUR', 'LDO', 'LPT', 'LQTY', 'MASK', 'MINA', 'MLN', 'OCEAN', 'OGN',
  'PAXG', 'POLS', 'POND', 'PUNDIX', 'QNT', 'RAD', 'RARE', 'RLC', 'RSR', 'SAND', 'SKL', 'SLP', 'SNT',
  'STX', 'SUKU', 'SXP', 'TRIBE', 'TRU', 'UFO', 'UNFI', 'USDP', 'VGX', 'WOO', 'YGG'
]

const ARBITRUM_TOKENS = [
  'WETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'COMP', 'SUSHI', 'MKR',
  'SNX', 'YFI', 'BAL', 'REN', 'ZRX', 'BAND', 'NMR', 'UMA', 'PERP', 'ALPHA', 'BADGER', 'FARM',
  'PICKLE', 'CREAM', 'ALCX', 'SPELL', 'MIM', 'FRAX', 'FEI', 'RARI', 'SUPER', 'DYDX', 'ENS',
  'IMX', 'OP', 'ARB', 'PEPE', 'BLUR', 'LDO', 'LPT', 'LQTY', 'MASK', 'MINA', 'MLN', 'OCEAN',
  'OGN', 'PAXG', 'POLS', 'POND', 'PUNDIX', 'QNT', 'RAD', 'RARE', 'RLC', 'RSR', 'SAND', 'SKL',
  'SLP', 'SNT', 'STX', 'SUKU', 'SXP', 'TRIBE', 'TRU', 'UFO', 'UNFI', 'USDP', 'VGX', 'WOO', 'YGG'
]

// Chain-specific token mappings
const CHAIN_TOKENS = {
  'ethereum': ETHEREUM_TOKENS,
  'bsc': BSC_TOKENS,
  'polygon': POLYGON_TOKENS,
  'avalanche': AVALANCHE_TOKENS,
  'fantom': FANTOM_TOKENS,
  'arbitrum': ARBITRUM_TOKENS
}

// DEX-specific search queries to ensure coverage
const DEX_SEARCH_QUERIES = {
  'uniswap-v2': ['USDT', 'USDC', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'COMP', 'SUSHI'],
  'sushiswap': ['USDT', 'USDC', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'COMP', 'SUSHI'],
  'quickswap': ['USDT', 'USDC', 'WMATIC', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV'],
  'spookyswap': ['USDT', 'USDC', 'WFTM', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV'],
  'pancakeswap': ['USDT', 'USDC', 'WBNB', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV', 'CAKE'],
  'traderjoe': ['USDT', 'USDC', 'WAVAX', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'CRV']
}

async function fetchDexScreenerPairsByTokenAddress(
  address: string
): Promise<DexScreenerPairRow[]> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`
  try {
    const resp = await axios.get<DexScreenerTokenResponse>(url, { timeout: 15000 })
    const pairs = resp.data?.pairs || []
    const rows: DexScreenerPairRow[] = []
    for (const p of pairs) {
      const price = Number(p.priceUsd)
      if (!p.chainId || !p.dexId || !isFinite(price) || price <= 0) continue
      if (!p.baseToken?.address) continue
      rows.push({
        chainId: String(p.chainId).toLowerCase(),
        dexId: String(p.dexId).toLowerCase(),
        priceUsd: price,
        baseToken: {
          address: p.baseToken.address.toLowerCase(),
          symbol: p.baseToken.symbol || '',
          name: p.baseToken.name || ''
        },
        quoteToken: {
          address: (p.quoteToken?.address || '').toLowerCase(),
          symbol: p.quoteToken?.symbol || '',
          name: p.quoteToken?.name || ''
        }
      })
    }
    return rows
  } catch (error) {
    console.error('Failed to fetch pairs from DexScreener:', error)
    return []
  }
}

async function resolveTokenAddress(query: string): Promise<{ address: string; symbol: string; chainId: string } | null> {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
  try {
    const resp = await axios.get<DexScreenerSearchResponse>(url, { timeout: 15000 })
    const pairs = resp.data?.pairs || []
    if (!pairs.length) return null

    const qUpper = query.trim().toUpperCase()
    // Try to find an exact symbol match on a major chain first
    const preferredChains = ['ethereum', 'bsc', 'polygon']
    for (const chain of preferredChains) {
        const exactMatch = pairs.find(p => (p.baseToken?.symbol || '').toUpperCase() === qUpper && p.chainId === chain && p.baseToken?.address)
        if (exactMatch && exactMatch.baseToken?.address) {
            return { address: exactMatch.baseToken.address.toLowerCase(), symbol: exactMatch.baseToken.symbol || qUpper, chainId: String(exactMatch.chainId).toLowerCase() }
        }
    }

    // Fallback to the first result that has a base token address
    const first = pairs.find(p => p.baseToken?.address)
    if (first && first.baseToken?.address) {
      return { address: first.baseToken.address.toLowerCase(), symbol: first.baseToken.symbol || qUpper, chainId: String(first.chainId || 'ethereum').toLowerCase() }
    }
    return null
  } catch (error) {
    console.error('Failed to resolve token address from DexScreener:', error)
    return null
  }
}

async function searchPairs(query: string): Promise<DexScreenerPairRow[]> {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
  const resp = await axios.get<DexScreenerSearchResponse>(url, { timeout: 20000 })
  const pairs = resp.data?.pairs || []
  const rows: DexScreenerPairRow[] = []
  for (const p of pairs) {
    const price = Number(p.priceUsd)
    if (!p.chainId || !p.dexId || !isFinite(price) || price <= 0) continue
    if (!p.baseToken?.address) continue
    rows.push({
      chainId: String(p.chainId).toLowerCase(),
      dexId: String(p.dexId).toLowerCase(),
      priceUsd: price,
      baseToken: {
        address: p.baseToken.address.toLowerCase(),
        symbol: p.baseToken.symbol || '',
        name: p.baseToken.name || ''
      },
      quoteToken: {
        address: (p.quoteToken?.address || '').toLowerCase(),
        symbol: p.quoteToken?.symbol || '',
        name: p.quoteToken?.name || ''
      }
    })
  }
  return rows
}

import { POPULAR_TOKENS } from '../data/tokens'

async function fetchUsdtPairsForChains(chains: string[]): Promise<DexScreenerPairRow[]> {
  console.log('Starting optimized token fetching for chains:', chains)

  // 1. Collect all token addresses for the selected chains
  let tokenAddresses: string[] = []
  for (const chain of chains) {
    if (POPULAR_TOKENS[chain]) {
      tokenAddresses.push(...Object.values(POPULAR_TOKENS[chain]))
    }
  }
  
  // Remove duplicates
  tokenAddresses = [...new Set(tokenAddresses)]
  
  if (tokenAddresses.length === 0) {
    console.log('No popular tokens found for the selected chains.')
    return []
  }

  // 2. Fetch all pairs for these tokens in a single API call
  const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddresses.join(',')}`
  
  try {
    const resp = await axios.get<DexScreenerTokenResponse>(url, { timeout: 20000 })
    const allPairs = resp.data?.pairs || []

    // 3. Filter, normalize, and deduplicate the results
    const rows: DexScreenerPairRow[] = []
    const seen = new Set<string>()

    for (const p of allPairs) {
      const price = Number(p.priceUsd)
      // Basic validation
      if (!p.chainId || !p.dexId || !isFinite(price) || price <= 0 || !p.baseToken?.address) continue

      // Filter by selected chains
      const chainId = String(p.chainId).toLowerCase()
      if (!chains.includes(chainId)) continue

      // Deduplicate by chain:dex:baseAddress
      const key = `${chainId}:${p.dexId}:${p.baseToken.address}`
      if (seen.has(key)) continue
      seen.add(key)

      rows.push({
        chainId: chainId,
        dexId: String(p.dexId).toLowerCase(),
        priceUsd: price,
        baseToken: {
          address: p.baseToken.address.toLowerCase(),
          symbol: p.baseToken.symbol || '',
          name: p.baseToken.name || ''
        },
        quoteToken: {
          address: (p.quoteToken?.address || '').toLowerCase(),
          symbol: p.quoteToken?.symbol || '',
          name: p.quoteToken?.name || ''
        }
      })
    }

    console.log(`Optimized fetching complete. Found ${rows.length} unique pairs.`)
    return rows

  } catch (error) {
    console.error('Failed to fetch pairs from DexScreener using optimized method:', error)
    // Fallback or error handling - for now, return empty
    return []
  }
}

async function fetchDirectFromDexs(): Promise<DexScreenerPairRow[]> {
  const pairs: DexScreenerPairRow[] = []
  
  // Fetch from each DEX specifically
  for (const [dexId, queries] of Object.entries(DEX_SEARCH_QUERIES)) {
    console.log(`Direct fetching from ${dexId}`)
    
    for (const query of queries) {
      try {
        const searchPairs = await searchPairs(query)
        const dexPairs = searchPairs.filter(pair => 
          pair.dexId.toLowerCase().includes(dexId.toLowerCase())
        )
        pairs.push(...dexPairs)
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Failed to fetch ${query} from ${dexId}:`, error)
      }
    }
  }
  
  return pairs
}

export default {
  fetchDexScreenerPairsByTokenAddress,
  resolveTokenAddress,
  fetchUsdtPairsForChains,
  fetchDirectFromDexs,
}
