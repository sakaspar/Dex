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
    quoteToken?: { address?: string; symbol?: string; name?: string }
  }>
}

export interface DexScreenerSearchResponse {
  pairs?: Array<{
    chainId?: string
    dexId?: string
    priceUsd?: string
    baseToken?: { address?: string; symbol?: string; name?: string }
    quoteToken?: { address?: string; symbol?: string; name?: string }
  }>
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

async function fetchUsdtPairsForChains(chains: string[]): Promise<DexScreenerPairRow[]> {
  // Run a few search patterns to widen coverage and then filter by chain
  const queries = ['USDT', 'USDC', 'DAI'] // Search for common stablecoins
  const settled = await Promise.allSettled(queries.map((q) => searchPairs(q)))
  const merged: DexScreenerPairRow[] = []
  for (const s of settled) {
    if (s.status === 'fulfilled') merged.push(...s.value)
  }
  // Keep only rows with USDT as quote (by symbol) and selected chains
  const allowedChains = new Set(chains.map((c) => c.toLowerCase()))
  const allowedQuotes = new Set(['USDT', 'USDC', 'DAI', 'WETH', 'WBNB', 'WMATIC'])

  const filtered = merged.filter((r) =>
    allowedChains.has(r.chainId) &&
    allowedQuotes.has((r.quoteToken.symbol || '').toUpperCase())
  )

  // Deduplicate by chain:baseAddress
  const seen = new Set<string>()
  const unique: DexScreenerPairRow[] = []
  for (const r of filtered) {
    const key = `${r.chainId}:${r.baseToken.address}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(r)
  }
  return unique
}


export default {
  fetchDexScreenerPairsByTokenAddress,
  resolveTokenAddress,
  fetchUsdtPairsForChains,
}
