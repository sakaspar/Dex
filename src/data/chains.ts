import { Chain, DEX } from '../types'

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'], // Public RPC
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
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
    logoURI: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    isActive: true
  },
  {
    id: 'fantom',
    name: 'Fantom',
    nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com'],
    logoURI: 'https://cryptologos.cc/logos/fantom-ftm-logo.png',
    isActive: true
  }
]

export const SUPPORTED_DEXS: DEX[] = [
  // Ethereum
  {
    id: 'uniswap-v2',
    name: 'Uniswap V2',
    chain: 'ethereum',
    logoURI: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    tradingFee: 0.003,
    version: 'V2'
  },
  {
    id: 'sushiswap-eth',
    name: 'SushiSwap',
    chain: 'ethereum',
    logoURI: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
    routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
    tradingFee: 0.003,
    version: 'V2'
  },
  // BSC
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    chain: 'bsc',
    logoURI: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
    routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    tradingFee: 0.0025,
    version: 'V2'
  },
  // Polygon
  {
    id: 'quickswap',
    name: 'QuickSwap',
    chain: 'polygon',
    logoURI: 'https://cryptologos.cc/logos/quickswap-quick-logo.png',
    routerAddress: '0xa5E0829CaCEd8fFDD4De3c74796aF668a5803888',
    factoryAddress: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
    tradingFee: 0.003,
    version: 'V2'
  },
  // Avalanche
  {
    id: 'traderjoe',
    name: 'TraderJoe',
    chain: 'avalanche',
    logoURI: 'https://www.traderjoexyz.com/static/media/logo.bc60f44e.svg',
    routerAddress: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
    factoryAddress: '0x9Ad6C38BE94206cA50bb0d9078318ddA7d756Fa5',
    tradingFee: 0.003,
    version: 'V2'
  },
  // Fantom
  {
    id: 'spookyswap',
    name: 'SpookySwap',
    chain: 'fantom',
    logoURI: 'https://spookyswap.finance/favicon.ico',
    routerAddress: '0xF491e7B69E4244ad4002BC14e878a34207E38c29',
    factoryAddress: '0x152eE697f2E276fA89E96742e9bB9f455F431228',
    tradingFee: 0.002,
    version: 'V2'
  }
]
