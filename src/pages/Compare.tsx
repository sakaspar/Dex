import React, { useState, useEffect } from 'react'
import { TrendingUp, RefreshCw, Filter, Search } from 'lucide-react'
import { DexScreenerPairRow } from '../services/dexScreenerService'
import dexScreenerService from '../services/dexScreenerService'
import { SUPPORTED_CHAINS } from '../data/chains'

interface CompareData {
  token: {
    symbol: string
    name: string
    address: string
  }
  prices: {
    [chainId: string]: {
      [dexId: string]: {
        price: number
        volume24h?: number
        liquidity?: number
        lastUpdated: Date
      }
    }
  }
}

const Compare: React.FC = () => {
  const [compareData, setCompareData] = useState<CompareData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChains, setSelectedChains] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'volume'>('symbol')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadCompareData()
  }, [])

  const loadCompareData = async () => {
    setIsLoading(true)
    try {
      // Fetch market data for all supported chains
      const allMarketData: DexScreenerPairRow[] = []
      
      for (const chain of SUPPORTED_CHAINS) {
        try {
          const chainData = await dexScreenerService.fetchUsdtPairsForChains([chain.id])
          allMarketData.push(...chainData)
        } catch (error) {
          console.warn(`Failed to fetch data for chain ${chain.id}:`, error)
        }
      }

      // Process the data to group by token
      const tokenMap = new Map<string, CompareData>()

      allMarketData.forEach(pair => {
        const tokenKey = pair.baseToken.address.toLowerCase()
        
        if (!tokenMap.has(tokenKey)) {
          tokenMap.set(tokenKey, {
            token: {
              symbol: pair.baseToken.symbol,
              name: pair.baseToken.name,
              address: pair.baseToken.address
            },
            prices: {}
          })
        }

        const tokenData = tokenMap.get(tokenKey)!
        
        if (!tokenData.prices[pair.chainId]) {
          tokenData.prices[pair.chainId] = {}
        }

        tokenData.prices[pair.chainId][pair.dexId] = {
          price: pair.priceUsd,
          lastUpdated: new Date()
        }
      })

      setCompareData(Array.from(tokenMap.values()))
    } catch (error) {
      console.error('Error loading compare data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredData = compareData
    .filter(item => 
      item.token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.token.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(item => 
      selectedChains.length === 0 || 
      Object.keys(item.prices).some(chainId => selectedChains.includes(chainId))
    )
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'symbol':
          aValue = a.token.symbol.toLowerCase()
          bValue = b.token.symbol.toLowerCase()
          break
        case 'price':
          // Get average price across all DEXes
          aValue = Object.values(a.prices).reduce((sum, dexPrices) => 
            sum + Object.values(dexPrices).reduce((dexSum, price) => dexSum + price.price, 0), 0
          ) / Object.values(a.prices).reduce((sum, dexPrices) => sum + Object.keys(dexPrices).length, 0)
          bValue = Object.values(b.prices).reduce((sum, dexPrices) => 
            sum + Object.values(dexPrices).reduce((dexSum, price) => dexSum + price.price, 0), 0
          ) / Object.values(b.prices).reduce((sum, dexPrices) => sum + Object.keys(dexPrices).length, 0)
          break
        case 'volume':
          aValue = 0 // Placeholder for volume sorting
          bValue = 0
          break
        default:
          aValue = a.token.symbol.toLowerCase()
          bValue = b.token.symbol.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getPriceDisplay = (prices: CompareData['prices']) => {
    const allPrices = Object.values(prices).flatMap(chainPrices => 
      Object.values(chainPrices).map(price => price.price)
    )
    
    if (allPrices.length === 0) return 'N/A'
    
    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)
    const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length
    
    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(6)}`
    }
    
    return `$${minPrice.toFixed(6)} - $${maxPrice.toFixed(6)}`
  }

  const getPriceVariation = (prices: CompareData['prices']) => {
    const allPrices = Object.values(prices).flatMap(chainPrices => 
      Object.values(chainPrices).map(price => price.price)
    )
    
    if (allPrices.length < 2) return 0
    
    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)
    
    return ((maxPrice - minPrice) / minPrice) * 100
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compare Prices</h1>
          <p className="text-gray-600 mt-2">
            Compare token prices across different DEXes and chains
          </p>
        </div>
        <button
          onClick={loadCompareData}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Chain Filter */}
          <div className="flex-shrink-0">
            <select
              multiple
              value={selectedChains}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                setSelectedChains(values)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
            >
              <option value="">All Chains</option>
              {SUPPORTED_CHAINS.map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex-shrink-0 flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="symbol">Sort by Symbol</option>
              <option value="price">Sort by Price</option>
              <option value="volume">Sort by Volume</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-primary-500 focus:border-primary-500"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-600" />
            <p className="mt-2 text-gray-600">Loading market data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">No tokens found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.token.symbol}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.token.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPriceDisplay(item.prices)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getPriceVariation(item.prices) > 5 
                          ? 'bg-red-100 text-red-800'
                          : getPriceVariation(item.prices) > 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getPriceVariation(item.prices).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Object.keys(item.prices).length} chains
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          // Expand to show detailed prices
                          const row = document.getElementById(`details-${index}`)
                          if (row) {
                            row.style.display = row.style.display === 'none' ? 'table-row' : 'none'
                          }
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Price Breakdown */}
      <div className="space-y-4">
        {filteredData.map((item, index) => (
          <div key={`details-${index}`} id={`details-${index}`} style={{ display: 'none' }} className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Price Breakdown for {item.token.symbol}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(item.prices).map(([chainId, dexPrices]) => (
                  <div key={chainId} className="bg-white p-3 rounded border">
                    <h5 className="font-medium text-gray-900 mb-2">
                      {SUPPORTED_CHAINS.find(c => c.id === chainId)?.name || chainId}
                    </h5>
                    <div className="space-y-1">
                      {Object.entries(dexPrices).map(([dexId, priceData]) => (
                        <div key={dexId} className="flex justify-between text-sm">
                          <span className="text-gray-600">{dexId}</span>
                          <span className="font-medium">${priceData.price.toFixed(6)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Compare
