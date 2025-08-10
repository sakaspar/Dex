import React, { useState, useEffect } from 'react'
import { Search, Filter, TrendingUp, RefreshCw, ExternalLink, AlertTriangle, Copy } from 'lucide-react'
import { ArbitrageOpportunity, FilterSettings } from '../types'
import arbitrageService from '../services/arbitrageService'
import dexScreenerService from '../services/dexScreenerService' // Keep for resolving token addresses
import { SUPPORTED_CHAINS, SUPPORTED_DEXS } from '../data/chains'

const ArbitrageScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>('')
  const [tradeSizeUSD, setTradeSizeUSD] = useState<number>(1000)
  const [tokenAddressInput, setTokenAddressInput] = useState<string>('')
  const [filters, setFilters] = useState<FilterSettings>({
    minProfitThreshold: 1, // Start with a more realistic threshold
    maxGasFeeTolerance: 50,
    selectedChains: SUPPORTED_CHAINS.map(chain => chain.id),
    selectedDEXs: SUPPORTED_DEXS.map(dex => dex.id),
    minLiquidity: 0, // Liquidity is not available yet
    minVolume24h: 0, // Volume is not available yet
    excludeCrossChain: true
  })

  useEffect(() => {
    applyFilters()
  }, [filters, opportunities])

  const applyFilters = () => {
    let filtered = opportunities.filter(opp => {
      if (opp.netProfit < filters.minProfitThreshold) return false
      if (opp.estimatedCosts.totalCosts > filters.maxGasFeeTolerance) return false
      if (!filters.selectedChains.includes(opp.buyDEX.dex.chain)) return false
      // DEX filter is implicitly handled by the scan now
      if (filters.excludeCrossChain && opp.isCrossChain) return false
      return true
    })
    
    filtered.sort((a, b) => b.netProfit - a.netProfit)
    setFilteredOpportunities(filtered)
  }

  const handleScan = async () => {
    if (!tokenAddressInput.trim()) {
      setScanStatus('Please enter a token symbol or contract address.')
      setTimeout(() => setScanStatus(''), 3000)
      return
    }

    setIsScanning(true)
    setOpportunities([]) // Clear previous results
    setScanStatus('Resolving token address...')

    try {
      let address = tokenAddressInput.trim()
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        const resolved = await dexScreenerService.resolveTokenAddress(address)
        if (!resolved) {
          setScanStatus(`Could not resolve token "${address}". Try the contract address.`)
          setIsScanning(false)
          return
        }
        address = resolved.address
      }

      setScanStatus('Scanning for opportunities on-chain...')
      const result = await arbitrageService.scanForOpportunities({
        tokenAddress: address,
        tradeSizeUSD,
        selectedChains: filters.selectedChains
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setOpportunities(result.opportunities)
      setScanStatus(`Scan complete! Found ${result.opportunities.length} potential opportunities in ${result.scanTime / 1000}s.`)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.'
      setScanStatus(`Scan failed: ${message}`)
    } finally {
      setIsScanning(false)
      setTimeout(() => setScanStatus(''), 5000)
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
    if (profit >= 10) return 'text-green-600'
    if (profit >= 1) return 'text-yellow-600'
    return 'text-red-600'
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
          <h1 className="text-3xl font-bold text-gray-900">On-Chain Arbitrage Scanner</h1>
          <p className="mt-2 text-gray-600">
            Find real arbitrage opportunities by quoting directly from DEXs.
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
            {isScanning && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{scanStatus}</span>
          </div>
        </div>
      )}

      {/* Top Opportunities Summary */}
      {!isScanning && filteredOpportunities.length > 0 && (
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
          <div className="flex-1 max-w-md">
            <label htmlFor="token-address" className="block text-sm font-medium text-gray-700 mb-2">
              Token Address or Symbol (e.g. UNI)
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

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Profit (USD)
                </label>
                <input
                  type="number"
                  value={filters.minProfitThreshold}
                  onChange={(e) => updateFilter('minProfitThreshold', parseFloat(e.target.value))}
                  className="input-field"
                  step="1"
                  min="0"
                />
              </div>
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="exclude-cross-chain"
                  checked={filters.excludeCrossChain}
                  onChange={(e) => updateFilter('excludeCrossChain', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="exclude-cross-chain" className="text-sm font-medium text-gray-700 ml-2">
                  Exclude Cross-Chain (not supported yet)
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Chains to Scan</label>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_CHAINS.map(chain => (
                  <label key={chain.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.selectedChains.includes(chain.id)}
                      onChange={(e) => {
                        const newSelection = e.target.checked
                          ? [...filters.selectedChains, chain.id]
                          : filters.selectedChains.filter(id => id !== chain.id)
                        updateFilter('selectedChains', newSelection)
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
            Results ({filteredOpportunities.length})
          </h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profitable opportunities found</h3>
            <p className="text-gray-500">
              Enter a token and click "Scan Now" or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy DEX</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell DEX</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Difference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Costs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOpportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-8 w-8 rounded-full" src={opportunity.token.logoURI} alt={opportunity.token.symbol} onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/32/${(Math.random() + 1).toString(36).substring(7)}/FFFFFF?text=${opportunity.token.symbol}`}} />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{opportunity.token.symbol}</div>
                          <div className="text-xs text-gray-500 break-all flex items-center space-x-2 mt-1">
                            <span>{opportunity.token.address}</span>
                            <button type="button" onClick={() => copyToClipboard(opportunity.token.address)} className="text-gray-400 hover:text-gray-600" title="Copy address">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{opportunity.buyDEX.dex.name}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(opportunity.buyDEX.priceUSD)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{opportunity.sellDEX.dex.name}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(opportunity.sellDEX.priceUSD)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(opportunity.priceDifference)}</div>
                      <div className="text-sm text-green-600">{formatPercentage(opportunity.priceDifferencePercent)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(opportunity.estimatedCosts.totalCosts)}</div>
                      <div className="text-xs text-gray-500">Gas: {formatCurrency(opportunity.estimatedCosts.buyGasFee + opportunity.estimatedCosts.sellGasFee)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${getProfitColor(opportunity.netProfit)}`}>{formatCurrency(opportunity.netProfit)}</div>
                      <div className={`text-sm ${getProfitColor(opportunity.netProfitPercent)}`}>{formatPercentage(opportunity.netProfitPercent)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(opportunity.riskLevel)}`}>{opportunity.riskLevel}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a className="text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-primary-50" title="View on block explorer" href={`${SUPPORTED_CHAINS.find(c => c.id === opportunity.buyDEX.dex.chain)?.blockExplorerUrls[0]}/token/${opportunity.token.address}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
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
