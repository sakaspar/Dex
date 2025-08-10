import React, { useState, useEffect } from 'react'
import { Search, Filter, TrendingUp, RefreshCw, ExternalLink, AlertTriangle, Copy } from 'lucide-react'
import { SUPPORTED_CHAINS, SUPPORTED_DEXS, POPULAR_TOKENS, MOCK_ARBITRAGE_OPPORTUNITIES } from '../data/mockData'
import { ArbitrageOpportunity, FilterSettings } from '../types'
import dexScreener from '../services/dexScreenerService'

const ArbitrageScanner: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>('')
  const [tradeSizeUSD, setTradeSizeUSD] = useState<number>(1000)
  const [tokenAddressInput, setTokenAddressInput] = useState<string>('')
  const [filters, setFilters] = useState<FilterSettings>({
    minProfitThreshold: 0.01,
    maxGasFeeTolerance: 0.1,
    selectedChains: SUPPORTED_CHAINS.map(chain => chain.id),
    selectedDEXs: SUPPORTED_DEXS.map(dex => dex.id),
    minLiquidity: 10000,
    minVolume24h: 1000,
    excludeCrossChain: false
  })

  useEffect(() => {
    // Load initial mock data
    setOpportunities(MOCK_ARBITRAGE_OPPORTUNITIES)
    setFilteredOpportunities(MOCK_ARBITRAGE_OPPORTUNITIES)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, opportunities])

  const applyFilters = () => {
    let filtered = opportunities.filter(opp => {
      // Profit threshold
      if (opp.netProfit < filters.minProfitThreshold) return false
      
      // Gas fee tolerance
      if (opp.estimatedCosts.totalCosts > filters.maxGasFeeTolerance) return false
      
      // Chain filter
      if (!filters.selectedChains.includes(opp.buyDEX.dex.chain) || 
          !filters.selectedChains.includes(opp.sellDEX.dex.chain)) return false
      
      // DEX filter
      if (!filters.selectedDEXs.includes(opp.buyDEX.dex.id) || 
          !filters.selectedDEXs.includes(opp.sellDEX.dex.id)) return false
      
      // Liquidity filter
      if (opp.buyDEX.liquidity < filters.minLiquidity || 
          opp.sellDEX.liquidity < filters.minLiquidity) return false
      
      // Volume filter
      if (opp.buyDEX.volume24h < filters.minVolume24h || 
          opp.sellDEX.volume24h < filters.minVolume24h) return false
      
      // Cross-chain filter
      if (filters.excludeCrossChain && opp.isCrossChain) return false
      
      return true
    })
    
    // Sort by net profit (highest first)
    filtered.sort((a, b) => b.netProfit - a.netProfit)
    
    setFilteredOpportunities(filtered)
  }

  const handleScan = async () => {
    setIsScanning(true)
    setScanStatus('Initializing scan...')
    
    try {
      // Live or mock scan steps
      const scanSteps = [
        'Checking input...',
        'Connecting to networks...',
        'Fetching live DEX prices...',
        'Analyzing arbitrage...',
        'Calculating fees...',
        'Finalizing results...'
      ]

      for (let i = 0; i < scanSteps.length; i++) {
        setScanStatus(scanSteps[i])
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Live token flow via DexScreener or fallback mock
      let newOpportunities: ArbitrageOpportunity[] = []
      if (tokenAddressInput.trim()) {
        let addressOrQuery = tokenAddressInput.trim()
        // Resolve symbol or name to contract address if needed
        if (!/^0x[a-fA-F0-9]{40}$/.test(addressOrQuery)) {
          const resolved = await dexScreener.resolveTokenAddress(addressOrQuery)
          if (!resolved) {
            setScanStatus('Could not resolve token. Please paste the contract address.')
            setIsScanning(false)
            return
          }
          addressOrQuery = resolved.address
        }
        const rows = await dexScreener.fetchDexScreenerPairsByTokenAddress(addressOrQuery)
        // Store latest rows for reuse in Markets
        dexScreener.setLatestRowsForToken(addressOrQuery, rows)
        const selectedChains = filters.selectedChains
        const builtAll: ArbitrageOpportunity[] = []
        for (const chainId of selectedChains) {
          const built = await dexScreener.buildArbitrageFromRows(rows, chainId, tradeSizeUSD, 0.2)
          builtAll.push(...built)
        }
        newOpportunities = builtAll
      } else {
        newOpportunities = generateNewOpportunities(tradeSizeUSD)
      }
      setOpportunities(prev => tokenAddressInput.trim() ? newOpportunities : [...prev, ...newOpportunities])
      setScanStatus(`Scan complete! Found ${newOpportunities.length} opportunities.`)
      
      setTimeout(() => setScanStatus(''), 3000)
    } catch (error) {
      setScanStatus('Scan failed. Please try again.')
      setTimeout(() => setScanStatus(''), 3000)
    } finally {
      setIsScanning(false)
    }
  }

  const generateNewOpportunities = (sizeUSD: number): ArbitrageOpportunity[] => {
    const tokens = ['USDC', 'USDT', 'DAI', 'WBTC', 'LINK', 'AAVE']
    const newOpportunities: ArbitrageOpportunity[] = []
    
    for (let i = 0; i < 3; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)]
      const buyPrice = 1 + Math.random() * 0.1
      const sellPrice = buyPrice * (1 + Math.random() * 0.05 + 0.02) // Ensure profit
      const tradeTokens = sizeUSD / buyPrice
      const tradingFeesUSD = (0.003 + 0.003) * sizeUSD
      const gasUSD = 6 // rough mock for both sides
      const grossUSD = (sellPrice - buyPrice) * tradeTokens
      const profit = grossUSD - tradingFeesUSD - gasUSD
      
      newOpportunities.push({
        id: `new-${Date.now()}-${i}`,
        token: {
          address: (Math.random().toString(16).padEnd(42, '0').slice(0, 42)).replace(/\.$/, '0'),
          name: token,
          symbol: token,
          decimals: 18,
          logoURI: `https://cryptologos.cc/logos/${token.toLowerCase()}-logo.png`
        },
        buyDEX: {
          dex: SUPPORTED_DEXS[Math.floor(Math.random() * SUPPORTED_DEXS.length)],
          token: POPULAR_TOKENS[0],
          price: buyPrice,
          priceUSD: buyPrice,
           liquidity: 0,
           volume24h: 0,
          lastUpdated: new Date()
        },
        sellDEX: {
          dex: SUPPORTED_DEXS[Math.floor(Math.random() * SUPPORTED_DEXS.length)],
          token: POPULAR_TOKENS[0],
          price: sellPrice,
          priceUSD: sellPrice,
           liquidity: 0,
           volume24h: 0,
          lastUpdated: new Date()
        },
        priceDifference: sellPrice - buyPrice,
        priceDifferencePercent: ((sellPrice - buyPrice) / buyPrice) * 100,
        estimatedCosts: {
           buyGasFee: gasUSD / 2,
           sellGasFee: gasUSD / 2,
           bridgeFee: 0,
           tradingFees: tradingFeesUSD,
           totalCosts: tradingFeesUSD + gasUSD
        },
        netProfit: profit,
         netProfitPercent: (profit / sizeUSD) * 100,
        isCrossChain: Math.random() > 0.7,
        riskLevel: Math.random() > 0.5 ? 'low' : 'medium',
        lastUpdated: new Date()
      })
    }
    
    return newOpportunities
  }

  const handleTokenSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      applyFilters()
    } else {
      const filtered = opportunities.filter(opp => 
        opp.token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        opp.token.name.toLowerCase().includes(query.toLowerCase()) ||
        opp.token.address.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredOpportunities(filtered)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getProfitColor = (profit: number) => {
    if (profit > 10) return 'text-green-600'
    if (profit > 5) return 'text-blue-600'
    if (profit > 1) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const updateFilter = (key: keyof FilterSettings, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getTopOpportunities = () => {
    return filteredOpportunities.slice(0, 3)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (_) {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Arbitrage Scanner</h1>
          <p className="mt-2 text-gray-600">
            Find profitable arbitrage opportunities across multiple DEXs and chains
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div>
            <label htmlFor="trade-size" className="block text-xs font-medium text-gray-600 mb-1">Trade Size (USD)</label>
            <input id="trade-size" type="number" min={100} step={50} value={tradeSizeUSD} onChange={(e)=> setTradeSizeUSD(parseFloat(e.target.value || '0'))} className="input-field w-40" />
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="btn-primary flex items-center space-x-2"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
          </button>
        </div>
      </div>

      {/* Scan Status */}
      {scanStatus && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2 text-blue-800">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{scanStatus}</span>
          </div>
        </div>
      )}

      {/* Top Opportunities Summary */}
      {filteredOpportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getTopOpportunities().map((opp, index) => (
            <div key={opp.id} className="card bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Top Opportunity #{index + 1}</div>
                  <div className="text-lg font-bold text-gray-900">{opp.token.symbol}</div>
                  <div className="text-sm text-gray-500">
                    {opp.buyDEX.dex.name} → {opp.sellDEX.dex.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getProfitColor(opp.netProfit)}`}>
                    {formatCurrency(opp.netProfit)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatPercentage(opp.netProfitPercent)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Token Search by Address (live) */}
          <div className="flex-1 max-w-md">
            <label htmlFor="token-address" className="block text-sm font-medium text-gray-700 mb-2">
              Token Address or Symbol (for live prices)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="token-address"
                type="text"
                placeholder="0x... or e.g. UNI"
                value={tokenAddressInput}
                onChange={(e) => setTokenAddressInput(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Profit Threshold (USD)
                </label>
                <input
                  type="number"
                  value={filters.minProfitThreshold}
                  onChange={(e) => updateFilter('minProfitThreshold', parseFloat(e.target.value))}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Fee Tolerance (USD)
                </label>
                <input
                  type="number"
                  value={filters.maxGasFeeTolerance}
                  onChange={(e) => updateFilter('maxGasFeeTolerance', parseFloat(e.target.value))}
                  className="input-field"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Liquidity (USD)
                </label>
                <input
                  type="number"
                  value={filters.minLiquidity}
                  onChange={(e) => updateFilter('minLiquidity', parseFloat(e.target.value))}
                  className="input-field"
                  step="1000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min 24h Volume (USD)
                </label>
                <input
                  type="number"
                  value={filters.minVolume24h}
                  onChange={(e) => updateFilter('minVolume24h', parseFloat(e.target.value))}
                  className="input-field"
                  step="1000"
                  min="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="exclude-cross-chain"
                  checked={filters.excludeCrossChain}
                  onChange={(e) => updateFilter('excludeCrossChain', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="exclude-cross-chain" className="text-sm font-medium text-gray-700">
                  Exclude Cross-Chain
                </label>
              </div>
            </div>

            {/* Chain Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Supported Chains</label>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_CHAINS.map(chain => (
                  <label key={chain.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.selectedChains.includes(chain.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFilter('selectedChains', [...filters.selectedChains, chain.id])
                        } else {
                          updateFilter('selectedChains', filters.selectedChains.filter(id => id !== chain.id))
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{chain.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Arbitrage Opportunities ({filteredOpportunities.length})
          </h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or scanning for new opportunities.
            </p>
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
                    Buy DEX
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sell DEX
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Difference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Costs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOpportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-8 w-8 rounded-full"
                          src={opportunity.token.logoURI}
                          alt={opportunity.token.symbol}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://via.placeholder.com/32x32?text=' + opportunity.token.symbol
                          }}
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {opportunity.token.symbol}
                          </div>
                          <div className="text-sm text-gray-500">
                            {opportunity.token.name}
                          </div>
                          <div className="text-xs text-gray-500 break-all flex items-center space-x-2 mt-1">
                            <span>{opportunity.token.address}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(opportunity.token.address)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Copy address"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          {opportunity.isCrossChain && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Cross-Chain
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-6 w-6 rounded-full"
                          src={opportunity.buyDEX.dex.logoURI}
                          alt={opportunity.buyDEX.dex.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://via.placeholder.com/24x24?text=' + opportunity.buyDEX.dex.name.substring(0, 2)
                          }}
                        />
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {opportunity.buyDEX.dex.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(opportunity.buyDEX.priceUSD)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-6 w-6 rounded-full"
                          src={opportunity.sellDEX.dex.logoURI}
                          alt={opportunity.sellDEX.dex.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://via.placeholder.com/24x24?text=' + opportunity.sellDEX.dex.name.substring(0, 2)
                          }}
                        />
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {opportunity.sellDEX.dex.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(opportunity.sellDEX.priceUSD)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(opportunity.priceDifference)}
                      </div>
                      <div className="text-sm text-success-600">
                        {formatPercentage(opportunity.priceDifferencePercent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Total: {formatCurrency(opportunity.estimatedCosts.totalCosts)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Gas: {formatCurrency(opportunity.estimatedCosts.buyGasFee + opportunity.estimatedCosts.sellGasFee)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getProfitColor(opportunity.netProfit)}`}>
                        {formatCurrency(opportunity.netProfit)}
                      </div>
                      <div className={`text-sm ${getProfitColor(opportunity.netProfitPercent)}`}>
                        {formatPercentage(opportunity.netProfitPercent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(opportunity.riskLevel)}`}>
                        {opportunity.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <a
                          className="text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-primary-50"
                          title="View contract"
                          href={(() => {
                            switch (opportunity.buyDEX.dex.chain) {
                              case 'ethereum':
                                return `https://etherscan.io/token/${opportunity.token.address}`
                              case 'bsc':
                                return `https://bscscan.com/token/${opportunity.token.address}`
                              case 'polygon':
                                return `https://polygonscan.com/token/${opportunity.token.address}`
                              case 'arbitrum':
                                return `https://arbiscan.io/token/${opportunity.token.address}`
                              default:
                                return '#'
                            }
                          })()}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArbitrageScanner
