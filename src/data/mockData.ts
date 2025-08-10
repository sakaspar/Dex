import { Chain, DEX, Token, ArbitrageOpportunity, GasPrice } from '../types'

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/your-key'],
    blockExplorerUrls: ['https://etherscan.io'],
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    isActive: true
  },
  {
    id: 'bsc',
    name: 'Binance Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    logoURI: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    isActive: true
  },
  {
    id: 'polygon',
    name: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    isActive: true
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    logoURI: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    isActive: true
  }
]

export const SUPPORTED_DEXS: DEX[] = [
  {
    id: 'uniswap-v3',
    name: 'Uniswap V3',
    chain: 'ethereum',
    logoURI: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    tradingFee: 0.003,
    version: 'V3'
  },
  {
    id: 'sushiswap',
    name: 'SushiSwap',
    chain: 'ethereum',
    logoURI: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
    routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
    tradingFee: 0.003,
    version: 'V2'
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    chain: 'bsc',
    logoURI: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
    routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    factoryAddress: '0xcA143Ce0Fe65960C6C5C4c7Bc8b8b8b8b8b8b8b8',
    tradingFee: 0.0025,
    version: 'V2'
  },
  {
    id: 'quickswap',
    name: 'QuickSwap',
    chain: 'polygon',
    logoURI: 'https://cryptologos.cc/logos/quickswap-quick-logo.png',
    routerAddress: '0xa5E0829CaCEd8fFDD4De3c74796aF668a5803888',
    factoryAddress: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
    tradingFee: 0.003,
    version: 'V2'
  }
]

export const POPULAR_TOKENS: Token[] = [
  {
    address: '0xA0b86a33E6441b8c4c8C8C8C8C8C8C8C8C8C8C8',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/uniswap-uni-logo.png'
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai',
    symbol: 'DAI',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png'
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/weth-logo.png'
  }
]

export const MOCK_ARBITRAGE_OPPORTUNITIES: ArbitrageOpportunity[] = [
  {
    id: '1',
    token: POPULAR_TOKENS[1], // UNI
    buyDEX: {
      dex: SUPPORTED_DEXS[1], // SushiSwap
      token: POPULAR_TOKENS[1],
      price: 5.42,
      priceUSD: 5.42,
      liquidity: 15000000,
      volume24h: 2500000,
      lastUpdated: new Date()
    },
    sellDEX: {
      dex: SUPPORTED_DEXS[0], // Uniswap V3
      token: POPULAR_TOKENS[1],
      price: 5.67,
      priceUSD: 5.67,
      liquidity: 20000000,
      volume24h: 3000000,
      lastUpdated: new Date()
    },
    priceDifference: 0.25,
    priceDifferencePercent: 4.61,
    estimatedCosts: {
      buyGasFee: 0.002,
      sellGasFee: 0.002,
      bridgeFee: 0,
      tradingFees: 0.016,
      totalCosts: 0.02
    },
    netProfit: 0.23,
    netProfitPercent: 4.24,
    isCrossChain: false,
    riskLevel: 'low',
    lastUpdated: new Date()
  },
  {
    id: '2',
    token: POPULAR_TOKENS[3], // WETH
    buyDEX: {
      dex: SUPPORTED_DEXS[2], // PancakeSwap (BSC)
      token: POPULAR_TOKENS[3],
      price: 1850.50,
      priceUSD: 1850.50,
      liquidity: 50000000,
      volume24h: 15000000,
      lastUpdated: new Date()
    },
    sellDEX: {
      dex: SUPPORTED_DEXS[0], // Uniswap V3 (Ethereum)
      token: POPULAR_TOKENS[3],
      price: 1895.75,
      priceUSD: 1895.75,
      liquidity: 80000000,
      volume24h: 25000000,
      lastUpdated: new Date()
    },
    priceDifference: 45.25,
    priceDifferencePercent: 2.45,
    estimatedCosts: {
      buyGasFee: 0.001,
      sellGasFee: 0.005,
      bridgeFee: 0.01,
      tradingFees: 0.055,
      totalCosts: 0.071
    },
    netProfit: 45.18,
    netProfitPercent: 2.44,
    isCrossChain: true,
    riskLevel: 'medium',
    lastUpdated: new Date()
  }
]

export const MOCK_GAS_PRICES: GasPrice[] = [
  {
    chain: 'ethereum',
    fast: 45,
    standard: 25,
    slow: 15,
    lastUpdated: new Date()
  },
  {
    chain: 'bsc',
    fast: 5,
    standard: 3,
    slow: 1,
    lastUpdated: new Date()
  },
  {
    chain: 'polygon',
    fast: 100,
    standard: 50,
    slow: 30,
    lastUpdated: new Date()
  }
]
