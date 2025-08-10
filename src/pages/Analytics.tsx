import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Calendar, TrendingUp, DollarSign, Activity, Filter } from 'lucide-react'
import { MOCK_ARBITRAGE_OPPORTUNITIES } from '../data/mockData'
import { SUPPORTED_CHAINS, SUPPORTED_DEXS } from '../data/chains'

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('profit')

  // Mock data for charts
  const profitData = [
    { date: '2024-01-01', profit: 45.23, opportunities: 12 },
    { date: '2024-01-02', profit: 67.89, opportunities: 18 },
    { date: '2024-01-03', profit: 34.56, opportunities: 15 },
    { date: '2024-01-04', profit: 89.12, opportunities: 22 },
    { date: '2024-01-05', profit: 56.78, opportunities: 19 },
    { date: '2024-01-06', profit: 78.90, opportunities: 25 },
    { date: '2024-01-07', profit: 92.34, opportunities: 28 }
  ]

  const chainData = SUPPORTED_CHAINS.map(chain => ({
    name: chain.name,
    opportunities: MOCK_ARBITRAGE_OPPORTUNITIES.filter(opp =>
      opp.buyDEX.dex.chain === chain.id || opp.sellDEX.dex.chain === chain.id
    ).length,
    volume: Math.random() * 1000000 + 500000
  }))

  const dexData = SUPPORTED_DEXS.map(dex => ({
    name: dex.name,
    opportunities: MOCK_ARBITRAGE_OPPORTUNITIES.filter(opp =>
      opp.buyDEX.dex.id === dex.id || opp.sellDEX.dex.id === dex.id
    ).length,
    volume: Math.random() * 2000000 + 1000000
  }))

  const riskData = [
    { name: 'Low Risk', value: MOCK_ARBITRAGE_OPPORTUNITIES.filter(opp => opp.riskLevel === 'low').length, color: '#22c55e' },
    { name: 'Medium Risk', value: MOCK_ARBITRAGE_OPPORTUNITIES.filter(opp => opp.riskLevel === 'medium').length, color: '#eab308' },
    { name: 'High Risk', value: MOCK_ARBITRAGE_OPPORTUNITIES.filter(opp => opp.riskLevel === 'high').length, color: '#ef4444' }
  ]

  const totalProfit = MOCK_ARBITRAGE_OPPORTUNITIES.reduce((sum, opp) => sum + opp.netProfit, 0)
  const totalOpportunities = MOCK_ARBITRAGE_OPPORTUNITIES.length
  const avgProfitPerOpportunity = totalOpportunities > 0 ? totalProfit / totalOpportunities : 0
  const successRate = 85 // Mock success rate

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Track your arbitrage performance and market insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalOpportunities)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Profit/Opportunity</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgProfitPerOpportunity)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profit Trend Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Opportunities by Chain */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunities by Chain</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chainData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [formatNumber(Number(value)), name]} />
              <Legend />
              <Bar dataKey="opportunities" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Opportunities']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* DEX Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">DEX Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dexData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [formatNumber(Number(value)), name]} />
              <Legend />
              <Bar dataKey="opportunities" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Chain Breakdown</h4>
            <div className="space-y-2">
              {chainData.map((chain) => (
                <div key={chain.name} className="flex justify-between text-sm">
                  <span className="text-gray-600">{chain.name}</span>
                  <span className="font-medium">{chain.opportunities} opportunities</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">DEX Breakdown</h4>
            <div className="space-y-2">
              {dexData.map((dex) => (
                <div key={dex.name} className="flex justify-between text-sm">
                  <span className="text-gray-600">{dex.name}</span>
                  <span className="font-medium">{dex.opportunities} opportunities</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Risk Analysis</h4>
            <div className="space-y-2">
              {riskData.map((risk) => (
                <div key={risk.name} className="flex justify-between text-sm">
                  <span className="text-gray-600">{risk.name}</span>
                  <span className="font-medium">{risk.value} opportunities</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Best Performing Chains</h4>
            <div className="space-y-2">
              {chainData
                .sort((a, b) => b.opportunities - a.opportunities)
                .slice(0, 3)
                .map((chain, index) => (
                  <div key={chain.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{chain.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{chain.opportunities}</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Top DEXs by Volume</h4>
            <div className="space-y-2">
              {dexData
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 3)
                .map((dex, index) => (
                  <div key={dex.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-success-100 text-success-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{dex.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(dex.volume)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
