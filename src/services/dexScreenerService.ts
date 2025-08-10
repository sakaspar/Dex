import axios from 'axios'
import { Chain, DEX, Token, PriceData, ArbitrageOpportunity } from '../types'
import { SUPPORTED_DEXS, SUPPORTED_CHAINS } from '../data/mockData'
import PriceService from './priceService'

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

function normalizeDexId(id: string): string {
  return id.toLowerCase()
}

function matchSupportedDex(dexId: string, chainId: string): DEX | null {
  const id = normalizeDexId(dexId)
  const found = SUPPORTED_DEXS.find(d => id.includes(d.id.split('-')[0]) && d.chain === chainId)
  if (found) return found
  // Fallback generic DEX object
  return {
    id,
    name: id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
    chain: chainId,
    logoURI: '',
    routerAddress: '',
    factoryAddress: '',
    tradingFee: 0.003,
    version: 'V2'
  }
}

export async function fetchDexScreenerPairsByTokenAddress(
  address: string
): Promise<DexScreenerPairRow[]> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`
  const resp = await axios.get<DexScreenerTokenResponse>(url, { timeout: 20000 })
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

export async function resolveTokenAddress(query: string): Promise<{ address: string; symbol: string; chainId: string } | null> {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
  const resp = await axios.get<DexScreenerSearchResponse>(url, { timeout: 20000 })
  const pairs = resp.data?.pairs || []
  if (!pairs.length) return null
  const qUpper = query.trim().toUpperCase()
  // Prefer exact symbol matches on Ethereum
  const exactEth = pairs.find(p => (p.baseToken?.symbol || '').toUpperCase() === qUpper && (p.chainId || '').toLowerCase() === 'ethereum')
  if (exactEth && exactEth.baseToken?.address) {
    return { address: exactEth.baseToken.address.toLowerCase(), symbol: exactEth.baseToken.symbol || qUpper, chainId: String(exactEth.chainId || 'ethereum').toLowerCase() }
  }
  // Any exact symbol match
  const exactAny = pairs.find(p => (p.baseToken?.symbol || '').toUpperCase() === qUpper && p.baseToken?.address)
  if (exactAny && exactAny.baseToken?.address) {
    return { address: exactAny.baseToken.address.toLowerCase(), symbol: exactAny.baseToken.symbol || qUpper, chainId: String(exactAny.chainId || 'ethereum').toLowerCase() }
  }
  // Fallback to first pair base token
  const first = pairs.find(p => p.baseToken?.address)
  if (first && first.baseToken?.address) {
    return { address: first.baseToken.address.toLowerCase(), symbol: first.baseToken.symbol || qUpper, chainId: String(first.chainId || 'ethereum').toLowerCase() }
  }
  return null
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

export async function fetchUsdtPairsForChains(chains: string[]): Promise<DexScreenerPairRow[]> {
  // Run a few search patterns to widen coverage and then filter by chain
  const queries = ['USDT', 'usdt pair', 'usdt token']
  chains.forEach((c) => {
    queries.push(`${c} usdt`)
  })
  const settled = await Promise.allSettled(queries.map((q) => searchPairs(q)))
  const merged: DexScreenerPairRow[] = []
  for (const s of settled) {
    if (s.status === 'fulfilled') merged.push(...s.value)
  }
  // Keep only rows with USDT as quote (by symbol) and selected chains
  const allowed = new Set(chains.map((c) => c.toLowerCase()))
  const filtered = merged.filter((r) => allowed.has(r.chainId) && (r.quoteToken.symbol || '').toUpperCase() === 'USDT')
  // Deduplicate by chain:baseAddress:dexId
  const seen = new Set<string>()
  const unique: DexScreenerPairRow[] = []
  for (const r of filtered) {
    const key = `${r.chainId}:${r.baseToken.address}:${r.dexId}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(r)
  }
  return unique
}

export async function buildArbitrageFromRows(
  rows: DexScreenerPairRow[],
  chainId: string,
  tradeSizeUSD: number,
  minDiffPct: number = 0.2
): Promise<ArbitrageOpportunity[]> {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId)
  if (!chain) return []

  // Only consider entries on the requested chain and USDT quote (or similar)
  const filtered = rows.filter(r => r.chainId === chainId)
  if (filtered.length < 2) return []

  // Prepare helpers
  const priceService = PriceService.getInstance()
  const nativePriceUSD = await getNativePriceUSDForChain(chain)
  let gasPriceGwei = await priceService.getGasPrice(chain)
  // Fallback per-chain gwei if provider fails
  const fallbackGwei: Record<string, number> = {
    ethereum: 25,
    bsc: 3,
    polygon: 50,
    arbitrum: 0.5,
  }
  if (!isFinite(gasPriceGwei) || gasPriceGwei <= 0) gasPriceGwei = fallbackGwei[chain.id] ?? 25

  // Chain-specific gas usage estimates per swap
  const gasPerSwapMap: Record<string, number> = {
    ethereum: 150_000,
    bsc: 120_000,
    polygon: 120_000,
    arbitrum: 200_000,
  }
  const gasPerSwap = gasPerSwapMap[chain.id] ?? 150_000
  const gasCostPerSwapUSD = (gasPriceGwei * 1e-9) * gasPerSwap * nativePriceUSD

  // Build all buy/sell combinations across different DEXes
  const opportunities: ArbitrageOpportunity[] = []
  for (let i = 0; i < filtered.length; i++) {
    for (let j = 0; j < filtered.length; j++) {
      if (i === j) continue
      const buy = filtered[i]
      const sell = filtered[j]
      if (buy.dexId === sell.dexId) continue

      const buyDEX = matchSupportedDex(buy.dexId, chainId)
      const sellDEX = matchSupportedDex(sell.dexId, chainId)
      if (!buyDEX || !sellDEX) continue

      const token: Token = {
        address: buy.baseToken.address,
        name: buy.baseToken.name,
        symbol: buy.baseToken.symbol,
        decimals: 18,
        logoURI: ''
      }

      const buyPrice = buy.priceUsd
      const sellPrice = sell.priceUsd
      const priceDiff = sellPrice - buyPrice
      const priceDiffPct = (priceDiff / buyPrice) * 100
      if (Math.abs(priceDiffPct) < minDiffPct) continue

      // Trading fees
      const notionalTokens = tradeSizeUSD / buyPrice
      const tradingFeesUSD = (buyDEX.tradingFee + sellDEX.tradingFee) * tradeSizeUSD

      // Gas costs (two swaps)
      const gasUSD = gasCostPerSwapUSD * 2

      const estimatedCosts = {
        buyGasFee: gasCostPerSwapUSD,
        sellGasFee: gasCostPerSwapUSD,
        bridgeFee: 0,
        tradingFees: tradingFeesUSD,
        totalCosts: tradingFeesUSD + gasUSD
      }

      const grossProfitUSD = (sellPrice - buyPrice) * notionalTokens
      const netProfitUSD = grossProfitUSD - estimatedCosts.totalCosts
      if (netProfitUSD <= 0) continue
      const netProfitPct = (netProfitUSD / tradeSizeUSD) * 100

      const priceDataBuy: PriceData = {
        dex: buyDEX,
        token,
        price: buyPrice,
        priceUSD: buyPrice,
        liquidity: 0,
        volume24h: 0,
        lastUpdated: new Date()
      }
      const priceDataSell: PriceData = {
        dex: sellDEX,
        token,
        price: sellPrice,
        priceUSD: sellPrice,
        liquidity: 0,
        volume24h: 0,
        lastUpdated: new Date()
      }

      opportunities.push({
        id: `${token.address}-${buy.dexId}-${sell.dexId}`,
        token,
        buyDEX: priceDataBuy,
        sellDEX: priceDataSell,
        priceDifference: priceDiff,
        priceDifferencePercent: priceDiffPct,
        estimatedCosts,
        netProfit: netProfitUSD,
        netProfitPercent: netProfitPct,
        isCrossChain: false,
        riskLevel: netProfitUSD > 20 ? 'low' : netProfitUSD > 10 ? 'medium' : 'high',
        lastUpdated: new Date()
      })
    }
  }

  // Deduplicate by best net profit per unique buy/sell pair
  opportunities.sort((a, b) => b.netProfit - a.netProfit)
  return opportunities
}
// In-memory store of latest rows per token address for cross-page reuse (e.g., Markets)
const latestRowsByToken = new Map<string, DexScreenerPairRow[]>()
export function setLatestRowsForToken(address: string, rows: DexScreenerPairRow[]) {
  latestRowsByToken.set(address.toLowerCase(), rows)
}
export function getAllLatestRows(): DexScreenerPairRow[] {
  return Array.from(latestRowsByToken.values()).flat()
}

async function getNativePriceUSDForChain(chain: Chain): Promise<number> {
  // Local mapping to avoid accessing private methods from PriceService
  const symbolToCoingecko: Record<string, string> = {
    ETH: 'ethereum',
    BNB: 'binancecoin',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
    FTM: 'fantom'
  }
  const id = symbolToCoingecko[chain.nativeCurrency.symbol.toUpperCase()] || 'ethereum'
  try {
    const resp = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`)
    return Number(resp.data?.[id]?.usd) || 1800
  } catch {
    return 1800
  }
}

export default {
  fetchDexScreenerPairsByTokenAddress,
  resolveTokenAddress,
  fetchUsdtPairsForChains,
  buildArbitrageFromRows,
  setLatestRowsForToken,
  getAllLatestRows
}


