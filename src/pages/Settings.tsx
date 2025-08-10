import React, { useState } from 'react'
import { Save, Bell, Shield, Globe, Database, Zap, AlertTriangle } from 'lucide-react'
import { SUPPORTED_CHAINS, SUPPORTED_DEXS } from '../data/mockData'

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: true,
      profitThreshold: 0.1,
      priceAlerts: true,
      volumeAlerts: false
    },
    scanning: {
      autoScan: true,
      scanInterval: 30,
      maxConcurrentScans: 5,
      retryAttempts: 3
    },
    display: {
      theme: 'light',
      currency: 'USD',
      timezone: 'UTC',
      refreshRate: 15
    },
    security: {
      requireWalletConfirmation: true,
      maxSlippage: 0.5,
      gasPriceBuffer: 20
    }
  })

  const [activeTab, setActiveTab] = useState('notifications')

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('dex-scanner-settings', JSON.stringify(settings))
    // Show success message
    alert('Settings saved successfully!')
  }

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'scanning', name: 'Scanning', icon: Zap },
    { id: 'display', name: 'Display', icon: Globe },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'chains', name: 'Chains & DEXs', icon: Database }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure your DEX arbitrage scanner preferences
          </p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      {/* Settings Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="mt-6">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => updateSetting('notifications', 'email', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">Receive email alerts for profitable opportunities</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.notifications.browser}
                      onChange={(e) => updateSetting('notifications', 'browser', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Browser Notifications</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">Show browser notifications when opportunities arise</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit Threshold Alert (USD)
                  </label>
                  <input
                    type="number"
                    value={settings.notifications.profitThreshold}
                    onChange={(e) => updateSetting('notifications', 'profitThreshold', parseFloat(e.target.value))}
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                  <p className="mt-1 text-sm text-gray-500">Minimum profit to trigger alerts</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.notifications.priceAlerts}
                      onChange={(e) => updateSetting('notifications', 'priceAlerts', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Price Movement Alerts</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">Alert on significant price changes</p>
                </div>
              </div>
            </div>
          )}

          {/* Scanning Tab */}
          {activeTab === 'scanning' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Scanning Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.scanning.autoScan}
                      onChange={(e) => updateSetting('scanning', 'autoScan', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-Scan</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">Automatically scan for opportunities</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.scanning.scanInterval}
                    onChange={(e) => updateSetting('scanning', 'scanInterval', parseInt(e.target.value))}
                    className="input-field"
                    min="15"
                    max="300"
                  />
                  <p className="mt-1 text-sm text-gray-500">How often to scan for opportunities</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Concurrent Scans
                  </label>
                  <input
                    type="number"
                    value={settings.scanning.maxConcurrentScans}
                    onChange={(e) => updateSetting('scanning', 'maxConcurrentScans', parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    max="10"
                  />
                  <p className="mt-1 text-sm text-gray-500">Maximum number of simultaneous scans</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    value={settings.scanning.retryAttempts}
                    onChange={(e) => updateSetting('scanning', 'retryAttempts', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                    max="5"
                  />
                  <p className="mt-1 text-sm text-gray-500">Number of retries on failed scans</p>
                </div>
              </div>
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Display Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.display.theme}
                    onChange={(e) => updateSetting('display', 'theme', e.target.value)}
                    className="input-field"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.display.currency}
                    onChange={(e) => updateSetting('display', 'currency', e.target.value)}
                    className="input-field"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.display.timezone}
                    onChange={(e) => updateSetting('display', 'timezone', e.target.value)}
                    className="input-field"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="PST">PST</option>
                    <option value="GMT">GMT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refresh Rate (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.display.refreshRate}
                    onChange={(e) => updateSetting('display', 'refreshRate', parseInt(e.target.value))}
                    className="input-field"
                    min="5"
                    max="60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.security.requireWalletConfirmation}
                      onChange={(e) => updateSetting('security', 'requireWalletConfirmation', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Require Wallet Confirmation</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">Always require wallet approval for transactions</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Slippage (%)
                  </label>
                  <input
                    type="number"
                    value={settings.security.maxSlippage}
                    onChange={(e) => updateSetting('security', 'maxSlippage', parseFloat(e.target.value))}
                    className="input-field"
                    step="0.1"
                    min="0.1"
                    max="10"
                  />
                  <p className="mt-1 text-sm text-gray-500">Maximum allowed slippage for trades</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gas Price Buffer (%)
                  </label>
                  <input
                    type="number"
                    value={settings.security.gasPriceBuffer}
                    onChange={(e) => updateSetting('security', 'gasPriceBuffer', parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                    max="100"
                  />
                  <p className="mt-1 text-sm text-gray-500">Additional buffer for gas price estimation</p>
                </div>
              </div>
            </div>
          )}

          {/* Chains & DEXs Tab */}
          {activeTab === 'chains' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Supported Networks & DEXs</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Blockchain Networks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SUPPORTED_CHAINS.map((chain) => (
                      <div key={chain.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <img src={chain.logoURI} alt={chain.name} className="w-6 h-6 rounded-full" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{chain.name}</div>
                          <div className="text-xs text-gray-500">{chain.nativeCurrency.symbol}</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${chain.isActive ? 'bg-success-500' : 'bg-gray-300'}`}></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">DEX Protocols</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SUPPORTED_DEXS.map((dex) => (
                      <div key={dex.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <img src={dex.logoURI} alt={dex.name} className="w-6 h-6 rounded-full" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{dex.name}</div>
                          <div className="text-xs text-gray-500">{dex.chain} • {dex.version}</div>
                        </div>
                        <div className="text-xs text-gray-500">{(dex.tradingFee * 100).toFixed(2)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Important Disclaimer</h3>
            <p className="mt-1 text-sm text-yellow-700">
              This tool is for informational purposes only. Cryptocurrency trading involves substantial risk and may result in the loss of your invested capital. 
              Always conduct your own research and consider consulting with a financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
