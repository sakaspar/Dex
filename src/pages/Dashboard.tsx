import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, DollarSign, Activity, AlertTriangle, ArrowRight, RefreshCw, TrendingDown, Zap } from 'lucide-react'
import { MOCK_ARBITRAGE_OPPORTUNITIES } from '../data/mockData'
import { SUPPORTED_CHAINS, SUPPORTED_DEXS } from '../data/chains'

const Dashboard: React.FC = () => {
  const [opportunities, setOpportunities] = useState(MOCK_ARBITRAGE_OPPORTUNITIES)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const totalOpportunities = opportunities.length
  const totalChains = SUPPORTED_CHAINS.filter(chain => chain.isActive).length
  const totalDEXs = SUPPORTED_DEXS.length
  
  // Calculate statistics
  const totalProfitPotential = opportunities.reduce((sum, opp) => sum + opp.netProfit, 0)
  const avgProfitPercent = opportunities.length > 0 
    ? opportunities.reduce((sum, opp) => sum + opp.netProfitPercent, 0) / opportunities.length 
    : 0
  const profitableOpportunities = opportunities.filter(opp => opp.netProfit > 0).length
  const highProfitOpportunities = opportunities.filter(opp => opp.netProfit > 10).length

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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLastUpdated(new Date())
    setIsRefreshing(false)
  }

  // Get top 3 most profitable opportunities
  const topOpportunities = [...opportunities]
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 3)

  // Get opportunities by chain
  const opportunitiesByChain = SUPPORTED_CHAINS.map(chain => ({
    chain,
    count: opportunities.filter(opp => 
      opp.buyDEX.dex.chain === chain.id || opp.sellDEX.dex.chain === chain.id
    ).length,
    totalProfit: opportunities.filter(opp => 
      opp.buyDEX.dex.chain === chain.id || opp.sellDEX.dex.chain === chain.id
    ).reduce((sum, opp) => sum + opp.netProfit, 0)
  }))

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Market Overview</h1>
          <p className="mt-2 text-gray-600">
            Monitor the best arbitrage opportunities across multiple DEXs and chains
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link to="/scanner" className="btn-primary flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Scan Now</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">{totalOpportunities}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit Potential</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalProfitPotential)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Profit (&gt;$10)</p>
              <p className="text-2xl font-bold text-gray-900">{highProfitOpportunities}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Profit %</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(avgProfitPercent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Top Profitable Deals</h2>
          <Link to="/scanner" className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {topOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No opportunities found. Start scanning to find deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topOpportunities.map((opportunity, index) => (
              <div key={opportunity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
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
                      <div className="font-medium text-gray-900">{opportunity.token.symbol}</div>
                      <div className="text-sm text-gray-500">#{index + 1} Best Deal</div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(opportunity.riskLevel)}`}>
                    {opportunity.riskLevel}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Buy on:</span>
                    <span className="font-medium">{opportunity.buyDEX.dex.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sell on:</span>
                    <span className="font-medium">{opportunity.sellDEX.dex.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price diff:</span>
                    <span className="text-green-600 font-medium">
                      {formatPercentage(opportunity.priceDifferencePercent)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Net Profit:</span>
                      <span className={`text-lg font-bold ${getProfitColor(opportunity.netProfit)}`}>
                        {formatCurrency(opportunity.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Market Overview by Chain */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Market Overview by Chain</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {opportunitiesByChain.map(({ chain, count, totalProfit }) => (
            <div key={chain.id} className="border border-gray-200 rounded-lg p-4 text-center">
              <img
                className="h-12 w-12 rounded-full mx-auto mb-3"
                src={chain.logoURI}
                alt={chain.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://via.placeholder.com/48x48?text=' + chain.name.substring(0, 2)
                }}
              />
              <h3 className="font-medium text-gray-900 mb-1">{chain.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{count} opportunities</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalProfit)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Scan</h3>
          <p className="text-gray-600 mb-4">
            Scan for arbitrage opportunities on popular tokens across all supported DEXs.
          </p>
          <Link to="/scanner" className="btn-primary inline-flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Start Scanning</span>
          </Link>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">View Analytics</h3>
          <p className="text-gray-600 mb-4">
            Analyze historical data and track market performance over time.
          </p>
          <Link to="/analytics" className="btn-secondary inline-flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>View Analytics</span>
          </Link>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  )
}

export default Dashboard
