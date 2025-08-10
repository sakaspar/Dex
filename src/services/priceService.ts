import { ethers } from 'ethers'
import { Chain, DEX, Token } from '../types'

// Standard ABI for Uniswap V2-style routers
const UNISWAP_V2_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
]

// Main stablecoin addresses, keyed by chain ID
const STABLECOINS: Record<string, string> = {
  ethereum: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  bsc: '0x55d398326f99059ff775485246999027b3197955', // USDT
  polygon: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
  arbitrum: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9' // USDT
}

export interface Quote {
  amountIn: bigint
  amountOut: bigint
  price: number
  priceUSD: number
}

export class PriceService {
  private static instance: PriceService
  private providers: Map<string, ethers.JsonRpcProvider> = new Map()

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService()
    }
    return PriceService.instance
  }

  private getProvider(chain: Chain): ethers.JsonRpcProvider {
    if (!this.providers.has(chain.id)) {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrls[0])
      this.providers.set(chain.id, provider)
    }
    return this.providers.get(chain.id)!
  }

  /**
   * Gets a real-time quote for a trade from a DEX router contract.
   * This is the core function for getting accurate, executable prices.
   */
  async getQuote(
    tradeSizeUSD: number,
    tokenIn: Token,
    tokenOut: Token,
    dex: DEX,
    chain: Chain
  ): Promise<Quote | null> {
    try {
      const provider = this.getProvider(chain)
      const router = new ethers.Contract(dex.routerAddress, UNISWAP_V2_ROUTER_ABI, provider)

      // To get a quote for a certain USD value, we first need to price the input token in USD.
      // We do this by getting a quote for swapping 1 unit of the token to the chain's main stablecoin.
      const stablecoinAddress = STABLECOINS[chain.id]
      if (!stablecoinAddress) {
        // console.error(`No stablecoin configured for chain ${chain.id}`)
        return null
      }

      // Path for pricing: TokenIn -> Stablecoin
      const pricingPath = [tokenIn.address, stablecoinAddress]
      const oneToken = ethers.parseUnits('1', tokenIn.decimals)

      let pricePerTokenUSD: number
      if (tokenIn.address.toLowerCase() === stablecoinAddress.toLowerCase()) {
        pricePerTokenUSD = 1.0
      } else {
        const amountsOut = await router.getAmountsOut(oneToken, pricingPath)
        // The second amount is the stablecoin value, which has 6 decimals for USDT
        pricePerTokenUSD = parseFloat(ethers.formatUnits(amountsOut[1], 6))
      }

      if (!pricePerTokenUSD || pricePerTokenUSD <= 0) {
        // console.error(`Could not determine USD price for ${tokenIn.symbol}`)
        return null
      }

      // Now calculate the amount of tokenIn needed for the desired trade size
      const amountIn = ethers.parseUnits((tradeSizeUSD / pricePerTokenUSD).toFixed(tokenIn.decimals), tokenIn.decimals)

      // Path for actual trade: TokenIn -> TokenOut
      const tradePath = [tokenIn.address, tokenOut.address]
      const tradeAmounts = await router.getAmountsOut(amountIn, tradePath)

      const amountOut = tradeAmounts[1]

      if (amountOut === 0n) return null

      // Final price based on the quote
      const price = parseFloat(ethers.formatUnits(amountOut, tokenOut.decimals)) / parseFloat(ethers.formatUnits(amountIn, tokenIn.decimals))

      return {
        amountIn,
        amountOut,
        price,
        priceUSD: price * pricePerTokenUSD,
      }
    } catch (error) {
      // console.error(`Failed to get quote from ${dex.name} on ${chain.name} for ${tokenIn.symbol}->${tokenOut.symbol}:`, error)
      return null
    }
  }

  /**
   * Gets a real-time quote for a specific input amount.
   */
  async getQuoteForAmountIn(
    amountIn: bigint,
    tokenIn: Token,
    tokenOut: Token,
    dex: DEX,
    chain: Chain
  ): Promise<bigint | null> {
    try {
      const provider = this.getProvider(chain)
      const router = new ethers.Contract(dex.routerAddress, UNISWAP_V2_ROUTER_ABI, provider)
      const tradePath = [tokenIn.address, tokenOut.address]
      const amounts = await router.getAmountsOut(amountIn, tradePath)
      return amounts[1]
    } catch (error) {
      // console.error(`Failed to get quote for amount from ${dex.name} on ${chain.name} for ${tokenIn.symbol}->${tokenOut.symbol}:`, error)
      return null
    }
  }

  /**
   * Fetches the current gas price for a chain.
   */
  async getGasPrice(chain: Chain): Promise<number> {
    try {
      const provider = this.getProvider(chain)
      const feeData = await provider.getFeeData()
      return Number(ethers.formatUnits(feeData.gasPrice || 0, 'gwei'))
    } catch (error) {
      // console.error(`Failed to fetch gas price for ${chain.name}:`, error)
      // Return a reasonable fallback
      const fallbackGwei: Record<string, number> = {
        ethereum: 25,
        bsc: 3,
        polygon: 50,
        arbitrum: 0.5,
      }
      return fallbackGwei[chain.id] ?? 25
    }
  }
}

export default PriceService.getInstance()
