import { ArbitrageOpportunity, Token, DEX, Chain } from '../types'
import { MOCK_ARBITRAGE_OPPORTUNITIES, SUPPORTED_CHAINS, SUPPORTED_DEXS } from '../data/mockData'

export interface ScanOptions {
  chains?: string[]
  dexs?: string[]
  minProfitThreshold?: number
  maxGasFeeTolerance?: number
  minLiquidity?: number
  minVolume24h?: number
  excludeCrossChain?: boolean
}

export interface ScanResult {
  opportunities: ArbitrageOpportunity[]
  scanTime: number
  chainsScanned: string[]
  dexsScanned: string[]
  totalOpportunities: number
  profitableOpportunities: number
  averageProfit: number
}

class ArbitrageService {
  private isScanning = false
  private scanProgress = 0
  private scanStatus = ''

  /**
   * Scan for arbitrage opportunities across specified chains and DEXs
   */
  async scanForOpportunities(options: ScanOptions = {}): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress')
    }

    this.isScanning = true
    this.scanProgress = 0
    this.scanStatus = 'Initializing scan...'

    try {
      const startTime = Date.now()
      
      // Simulate scanning different networks
      await this.simulateNetworkScan(options)
      
      // Generate mock opportunities based on options
      const opportunities = this.generateMockOpportunities(options)
      
      // Apply filters
      const filteredOpportunities = this.applyFilters(opportunities, options)
      
      // Sort by profit (highest first)
      filteredOpportunities.sort((a, b) => b.netProfit - a.netProfit)
      
      const scanTime = Date.now() - startTime
      
      const result: ScanResult = {
        opportunities: filteredOpportunities,
        scanTime,
        chainsScanned: options.chains || SUPPORTED_CHAINS.map(c => c.id),
        dexsScanned: options.dexs || SUPPORTED_DEXS.map(d => d.id),
        totalOpportunities: filteredOpportunities.length,
        profitableOpportunities: filteredOpportunities.filter(opp => opp.netProfit > 0).length,
        averageProfit: filteredOpportunities.length > 0 
          ? filteredOpportunities.reduce((sum, opp) => sum + opp.netProfit, 0) / filteredOpportunities.length 
          : 0
      }

      this.scanStatus = `Scan complete! Found ${result.totalOpportunities} opportunities.`
      return result

    } catch (error) {
      this.scanStatus = 'Scan failed: ' + (error as Error).message
      throw error
    } finally {
      this.isScanning = false
      this.scanProgress = 100
    }
  }

  /**
   * Simulate scanning different networks with progress updates
   */
  private async simulateNetworkScan(options: ScanOptions): Promise<void> {
    const chains = options.chains || SUPPORTED_CHAINS.map(c => c.id)
    const dexs = options.dexs || SUPPORTED_DEXS.map(d => d.id)
    
    const totalSteps = chains.length * dexs.length + 3 // +3 for analysis steps
    let currentStep = 0

    // Simulate connecting to each chain
    for (const chainId of chains) {
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId)
      if (chain) {
        this.scanStatus = `Connecting to ${chain.name} network...`
        await this.delay(200)
        currentStep++
        this.scanProgress = (currentStep / totalSteps) * 100
      }
    }

    // Simulate scanning each DEX
    for (const dexId of dexs) {
      const dex = SUPPORTED_DEXS.find(d => d.id === dexId)
      if (dex) {
        this.scanStatus = `Fetching prices from ${dex.name}...`
        await this.delay(300)
        currentStep++
        this.scanProgress = (currentStep / totalSteps) * 100
      }
    }

    // Final analysis steps
    this.scanStatus = 'Analyzing arbitrage opportunities...'
    await this.delay(200)
    currentStep++
    this.scanProgress = (currentStep / totalSteps) * 100

    this.scanStatus = 'Calculating profit margins...'
    await this.delay(200)
    currentStep++
    this.scanProgress = (currentStep / totalSteps) * 100

    this.scanStatus = 'Finalizing results...'
    await this.delay(200)
    currentStep++
    this.scanProgress = (currentStep / totalSteps) * 100
  }

  /**
   * Generate mock opportunities based on scan options
   */
  private generateMockOpportunities(options: ScanOptions): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = []
    const tokens = ['USDC', 'USDT', 'DAI', 'WBTC', 'LINK', 'AAVE', 'UNI', 'CRV', 'COMP', 'MKR']
    
    // Generate 5-15 opportunities
    const numOpportunities = 5 + Math.floor(Math.random() * 10)
    
    for (let i = 0; i < numOpportunities; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)]
      const buyPrice = 0.5 + Math.random() * 2 // Price between $0.5 and $2.5
      const priceDifference = (Math.random() * 0.1 + 0.02) * buyPrice // 2-12% difference
      const sellPrice = buyPrice + priceDifference
      
      // Calculate profit (assuming $1000 trade size)
      const tradeSize = 1000
      const grossProfit = (sellPrice - buyPrice) * (tradeSize / buyPrice)
      const tradingFees = (buyPrice + sellPrice) * (tradeSize / buyPrice) * 0.003 // 0.3% fee
      const gasFees = Math.random() * 0.02 + 0.005 // $5-$25 in gas
      const netProfit = grossProfit - tradingFees - gasFees
      
      const opportunity: ArbitrageOpportunity = {
        id: `scan-${Date.now()}-${i}`,
        token: {
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
          name: token,
          symbol: token,
          decimals: 18,
          logoURI: `https://cryptologos.cc/logos/${token.toLowerCase()}-logo.png`
        },
        buyDEX: {
          dex: SUPPORTED_DEXS[Math.floor(Math.random() * SUPPORTED_DEXS.length)],
          token: { address: '', name: token, symbol: token, decimals: 18 },
          price: buyPrice,
          priceUSD: buyPrice,
          liquidity: 50000 + Math.random() * 200000,
          volume24h: 10000 + Math.random() * 100000,
          lastUpdated: new Date()
        },
        sellDEX: {
          dex: SUPPORTED_DEXS[Math.floor(Math.random() * SUPPORTED_DEXS.length)],
          token: { address: '', name: token, symbol: token, decimals: 18 },
          price: sellPrice,
          priceUSD: sellPrice,
          liquidity: 50000 + Math.random() * 200000,
          volume24h: 10000 + Math.random() * 100000,
          lastUpdated: new Date()
        },
        priceDifference: priceDifference,
        priceDifferencePercent: (priceDifference / buyPrice) * 100,
        estimatedCosts: {
          buyGasFee: gasFees / 2,
          sellGasFee: gasFees / 2,
          bridgeFee: Math.random() > 0.8 ? Math.random() * 0.01 : 0, // 20% chance of cross-chain
          tradingFees: tradingFees,
          totalCosts: gasFees + tradingFees
        },
        netProfit: netProfit,
        netProfitPercent: (netProfit / tradeSize) * 100,
        isCrossChain: Math.random() > 0.8,
        riskLevel: netProfit > 20 ? 'low' : netProfit > 10 ? 'medium' : 'high',
        lastUpdated: new Date()
      }
      
      opportunities.push(opportunity)
    }
    
    return opportunities
  }

  /**
   * Apply filters to opportunities
   */
  private applyFilters(opportunities: ArbitrageOpportunity[], options: ScanOptions): ArbitrageOpportunity[] {
    return opportunities.filter(opp => {
      // Profit threshold
      if (options.minProfitThreshold && opp.netProfit < options.minProfitThreshold) {
        return false
      }
      
      // Gas fee tolerance
      if (options.maxGasFeeTolerance && opp.estimatedCosts.totalCosts > options.maxGasFeeTolerance) {
        return false
      }
      
      // Chain filter
      if (options.chains && (!options.chains.includes(opp.buyDEX.dex.chain) || 
          !options.chains.includes(opp.sellDEX.dex.chain))) {
        return false
      }
      
      // DEX filter
      if (options.dexs && (!options.dexs.includes(opp.buyDEX.dex.id) || 
          !options.dexs.includes(opp.sellDEX.dex.id))) {
        return false
      }
      
      // Liquidity filter
      if (options.minLiquidity && (opp.buyDEX.liquidity < options.minLiquidity || 
          opp.sellDEX.liquidity < options.minLiquidity)) {
        return false
      }
      
      // Volume filter
      if (options.minVolume24h && (opp.buyDEX.volume24h < options.minVolume24h || 
          opp.sellDEX.volume24h < options.minVolume24h)) {
        return false
      }
      
      // Cross-chain filter
      if (options.excludeCrossChain && opp.isCrossChain) {
        return false
      }
      
      return true
    })
  }

  /**
   * Get current scan status
   */
  getScanStatus(): { isScanning: boolean; progress: number; status: string } {
    return {
      isScanning: this.isScanning,
      progress: this.scanProgress,
      status: this.scanStatus
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): Chain[] {
    return SUPPORTED_CHAINS
  }

  /**
   * Get supported DEXs
   */
  getSupportedDEXs(): DEX[] {
    return SUPPORTED_DEXS
  }

  /**
   * Get mock opportunities for testing
   */
  getMockOpportunities(): ArbitrageOpportunity[] {
    return MOCK_ARBITRAGE_OPPORTUNITIES
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const arbitrageService = new ArbitrageService()
export default arbitrageService
