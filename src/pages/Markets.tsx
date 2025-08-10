import React, { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { DexScreenerPairRow } from '../services/dexScreenerService'
import marketService from '../services/marketService'
import { SUPPORTED_CHAINS } from '../data/chains'

interface TokenAggregate {
  address: string
  symbol: string
  name: string
  chains: Record<string, { dexCount: number; minPrice: number; maxPrice: number }>
  totalDexCount: number
}

const Markets: React.FC = () => {
  const [rows, setRows] = useState<DexScreenerPairRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [query, setQuery] = useState('')
  const [selectedDex, setSelectedDex] = useState<string>('all')
  const [selectedChain, setSelectedChain] = useState<string>('all')

  const load = async (forceRefresh = false) => {
    setIsLoading(true)
    try {
      const data = await marketService.getMarketData(forceRefresh)
      setRows(data)
      setLastUpdated(new Date())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load() // Initial load
    const id = setInterval(() => load(), 60_000) // Auto-refresh every minute
    return () => clearInterval(id)
  }, [])

  const tokens = useMemo<TokenAggregate[]>(() => {
    const map: Record<string, TokenAggregate> = {}
    for (const r of rows) {
      // Apply DEX filter
      if (selectedDex !== 'all' && !r.dexId.toLowerCase().includes(selectedDex.toLowerCase())) {
        continue
      }
      
      // Apply chain filter
      if (selectedChain !== 'all' && r.chainId.toLowerCase() !== selectedChain.toLowerCase()) {
        continue
      }

      const key = r.baseToken.address
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
  }, [rows, query, selectedDex, selectedChain])

  const getChainName = (id: string) => SUPPORTED_CHAINS.find(c => c.id === id)?.name || id

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Markets</h1>
          <p className="mt-2 text-gray-600">Popular tokens across all supported DEXs.</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button onClick={() => load(true)} className="btn-secondary flex items-center space-x-2" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by symbol, name, or address..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={selectedDex}
              onChange={(e) => setSelectedDex(e.target.value)}
              className="input-field w-full sm:w-48"
            >
              <option value="all">All DEXs</option>
              <option value="uniswap-v2">Uniswap V2</option>
              <option value="sushiswap">SushiSwap</option>
              <option value="quickswap">QuickSwap</option>
              <option value="spookyswap">SpookySwap</option>
              <option value="pancakeswap">PancakeSwap</option>
              <option value="traderjoe">TraderJoe</option>
            </select>

            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="input-field w-full sm:w-48"
            >
              <option value="all">All Chains</option>
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="polygon">Polygon</option>
              <option value="avalanche">Avalanche</option>
              <option value="fantom">Fantom</option>
              <option value="arbitrum">Arbitrum</option>
            </select>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <div className="text-sm text-gray-500">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </div>
            <div className="text-sm text-gray-600">
              Showing {tokens.length} tokens
              {selectedDex !== 'all' && ` on ${selectedDex}`}
              {selectedChain !== 'all' && ` (${selectedChain})`}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chains</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total DEXs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Range (USD)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span>Loading market data...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && tokens.map((t) => (
                <tr key={t.address} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-8 w-8 rounded-full" src={`https://tokens.1inch.io/${t.address}.png`} alt={t.symbol} onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/32/${(Math.random() + 1).toString(36).substring(7)}/FFFFFF?text=${t.symbol}`}} />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{t.symbol}</div>
                        <div className="text-sm text-gray-500">{t.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(t.chains).map(([chainId, info]) => (
                        <span key={chainId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title={`${info.dexCount} DEXs on ${getChainName(chainId)}`}>
                          {getChainName(chainId)}
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
                      if (min === max) return formatCurrency(min)
                      return `${formatCurrency(min)} - ${formatCurrency(max)}`
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
