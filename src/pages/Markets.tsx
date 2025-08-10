import React, { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { SUPPORTED_CHAINS } from '../data/chains'
import dexScreener, { DexScreenerPairRow } from '../services/dexScreenerService'

interface TokenAggregate {
  address: string
  symbol: string
  name: string
  chains: Record<string, { dexCount: number; minPrice: number; maxPrice: number }>
  totalDexCount: number
}

const Markets: React.FC = () => {
  const [rows, setRows] = useState<DexScreenerPairRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [query, setQuery] = useState('')

  const selectedChains = SUPPORTED_CHAINS.map((c) => c.id)

  const load = async () => {
    setIsLoading(true)
    try {
      // Merge: any rows saved during Scanner runs + fresh USDT pairs
      const cached = dexScreener.getAllLatestRows()
      const fetched = await dexScreener.fetchUsdtPairsForChains(selectedChains)
      const merged = [...cached, ...fetched]
      // Deduplicate by chain:base:DEX
      const seen = new Set<string>()
      const unique: DexScreenerPairRow[] = []
      for (const r of merged) {
        const key = `${r.chainId}:${r.baseToken.address}:${r.dexId}`
        if (seen.has(key)) continue
        seen.add(key)
        unique.push(r)
      }
      setRows(unique)
      setLastUpdated(new Date())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  const tokens = useMemo<TokenAggregate[]>(() => {
    const map: Record<string, TokenAggregate> = {}
    for (const r of rows) {
      const key = `${r.baseToken.address}`
      if (!map[key]) {
        map[key] = {
          address: r.baseToken.address,
          symbol: r.baseToken.symbol,
          name: r.baseToken.name,
          chains: {},
          totalDexCount: 0,
        }
      }
      const ag = map[key]
      if (!ag.chains[r.chainId]) {
        ag.chains[r.chainId] = { dexCount: 0, minPrice: r.priceUsd, maxPrice: r.priceUsd }
      }
      const ch = ag.chains[r.chainId]
      ch.dexCount += 1
      ch.minPrice = Math.min(ch.minPrice, r.priceUsd)
      ch.maxPrice = Math.max(ch.maxPrice, r.priceUsd)
      ag.totalDexCount += 1
    }
    let list = Object.values(map)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.address.toLowerCase().includes(q))
    }
    list.sort((a, b) => b.totalDexCount - a.totalDexCount)
    return list
  }, [rows, query])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Markets</h1>
          <p className="mt-2 text-gray-600">All tokens scanned from supported DEXs (USDT pairs)</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button onClick={load} className="btn-secondary flex items-center space-x-2" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by symbol, name, or address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="text-sm text-gray-500 ml-4">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : '—'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chains</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DEXs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Range (USD)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tokens.map((t) => (
                <tr key={t.address} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{t.symbol}</div>
                    <div className="text-sm text-gray-500">{t.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs break-all text-gray-600">{t.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(t.chains).map(([chainId, info]) => (
                        <span key={chainId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {chainId} · {info.dexCount}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.totalDexCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const allRanges = Object.values(t.chains)
                      const min = Math.min(...allRanges.map((c) => c.minPrice))
                      const max = Math.max(...allRanges.map((c) => c.maxPrice))
                      return `${formatCurrency(min)} — ${formatCurrency(max)}`
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Markets


