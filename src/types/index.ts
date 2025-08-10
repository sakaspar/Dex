export interface Token {
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

export interface DEX {
  id: string
  name: string
  chain: string
  logoURI: string
  routerAddress: string
  factoryAddress: string
  tradingFee: number
  version: string
}

export interface PriceData {
  dex: DEX
  token: Token
  price: number
  priceUSD: number
  liquidity: number
  volume24h: number
  lastUpdated: Date
}

export interface ArbitrageOpportunity {
  id: string
  token: Token
  buyDEX: PriceData
  sellDEX: PriceData
  priceDifference: number
  priceDifferencePercent: number
  estimatedCosts: {
    buyGasFee: number
    sellGasFee: number
    bridgeFee: number
    tradingFees: number
    totalCosts: number
  }
  netProfit: number
  netProfitPercent: number
  isCrossChain: boolean
  riskLevel: 'low' | 'medium' | 'high'
  lastUpdated: Date
}

export interface Chain {
  id: string
  name: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
  logoURI: string
  isActive: boolean
}

export interface FilterSettings {
  minProfitThreshold: number
  maxGasFeeTolerance: number
  selectedChains: string[]
  selectedDEXs: string[]
  minLiquidity: number
  minVolume24h: number
  excludeCrossChain: boolean
}

export interface GasPrice {
  chain: string
  fast: number
  standard: number
  slow: number
  lastUpdated: Date
}

export interface Alert {
  id: string
  type: 'profit' | 'price' | 'volume'
  message: string
  isRead: boolean
  createdAt: Date
}
