import axios from 'axios'

export interface DexScreenerPairRow {
  chainId: string
  dexId: string
  priceUsd: number
  baseToken: { address: string; symbol: string; name: string }
  quoteToken: { address: string; symbol: string; name: string }
}

export interface DexScreenerTokenResponse {
  pairs?: Array<{
    chainId?: string
    dexId?: string
    priceUsd?: string
    baseToken?: { address?: string; symbol?: string; name?: string }
    quoteToken?: { address?: string; symbol?: string; name?: string }
  }>
}

export interface DexScreenerSearchResponse {
  pairs?: Array<{
    chainId?: string
    dexId?: string
    priceUsd?: string
    baseToken?: { address?: string; symbol?: string; name?: string }
    quoteToken?: { address?: string; symbol?: string; name?: string }
  }>
}

async function fetchDexScreenerPairsByTokenAddress(
  address: string
): Promise<DexScreenerPairRow[]> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`
  try {
    const resp = await axios.get<DexScreenerTokenResponse>(url, { timeout: 15000 })
    const pairs = resp.data?.pairs || []
    const rows: DexScreenerPairRow[] = []
    for (const p of pairs) {
      const price = Number(p.priceUsd)
      if (!p.chainId || !p.dexId || !isFinite(price) || price <= 0) continue
      if (!p.baseToken?.address) continue
      rows.push({
        chainId: String(p.chainId).toLowerCase(),
        dexId: String(p.dexId).toLowerCase(),
        priceUsd: price,
        baseToken: {
          address: p.baseToken.address.toLowerCase(),
          symbol: p.baseToken.symbol || '',
          name: p.baseToken.name || ''
        },
        quoteToken: {
          address: (p.quoteToken?.address || '').toLowerCase(),
          symbol: p.quoteToken?.symbol || '',
          name: p.quoteToken?.name || ''
        }
      })
    }
    return rows
  } catch (error) {
    console.error('Failed to fetch pairs from DexScreener:', error)
    return []
  }
}

async function resolveTokenAddress(query: string): Promise<{ address: string; symbol: string; chainId: string } | null> {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
  try {
    const resp = await axios.get<DexScreenerSearchResponse>(url, { timeout: 15000 })
    const pairs = resp.data?.pairs || []
    if (!pairs.length) return null

    const qUpper = query.trim().toUpperCase()
    // Try to find an exact symbol match on a major chain first
    const preferredChains = ['ethereum', 'bsc', 'polygon']
    for (const chain of preferredChains) {
        const exactMatch = pairs.find(p => (p.baseToken?.symbol || '').toUpperCase() === qUpper && p.chainId === chain && p.baseToken?.address)
        if (exactMatch && exactMatch.baseToken?.address) {
            return { address: exactMatch.baseToken.address.toLowerCase(), symbol: exactMatch.baseToken.symbol || qUpper, chainId: String(exactMatch.chainId).toLowerCase() }
        }
    }

    // Fallback to the first result that has a base token address
    const first = pairs.find(p => p.baseToken?.address)
    if (first && first.baseToken?.address) {
      return { address: first.baseToken.address.toLowerCase(), symbol: first.baseToken.symbol || qUpper, chainId: String(first.chainId || 'ethereum').toLowerCase() }
    }
    return null
  } catch (error) {
    console.error('Failed to resolve token address from DexScreener:', error)
    return null
  }
}

async function searchPairs(query: string): Promise<DexScreenerPairRow[]> {
  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
  const resp = await axios.get<DexScreenerSearchResponse>(url, { timeout: 20000 })
  const pairs = resp.data?.pairs || []
  const rows: DexScreenerPairRow[] = []
  for (const p of pairs) {
    const price = Number(p.priceUsd)
    if (!p.chainId || !p.dexId || !isFinite(price) || price <= 0) continue
    if (!p.baseToken?.address) continue
    rows.push({
      chainId: String(p.chainId).toLowerCase(),
      dexId: String(p.dexId).toLowerCase(),
      priceUsd: price,
      baseToken: {
        address: p.baseToken.address.toLowerCase(),
        symbol: p.baseToken.symbol || '',
        name: p.baseToken.name || ''
      },
      quoteToken: {
        address: (p.quoteToken?.address || '').toLowerCase(),
        symbol: p.quoteToken?.symbol || '',
        name: p.quoteToken?.name || ''
      }
    })
  }
  return rows
}

async function fetchUsdtPairsForChains(chains: string[]): Promise<DexScreenerPairRow[]> {
  // Define popular tokens to track across all DEXs - Expanded list for better coverage
  const popularTokens = [
    // Major tokens
    { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', name: 'Wrapped Ether' },
    { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap' },
    { symbol: 'LINK', address: '0x514910771af9ca656af840dff83e8264ecf986ca', name: 'Chainlink' },
    { symbol: 'MATIC', address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', name: 'Polygon' },
    { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', name: 'Wrapped Bitcoin' },
    { symbol: 'SHIB', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', name: 'Shiba Inu' },
    { symbol: 'AAVE', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', name: 'Aave' },
    { symbol: 'CRV', address: '0xd533a949740bb3306d119cc777fa900ba034cd52', name: 'Curve DAO Token' },
    { symbol: 'COMP', address: '0xc00e94cb662c3520282e6f5717214004a7f26888', name: 'Compound' },
    { symbol: 'SUSHI', address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', name: 'SushiSwap' },
    { symbol: 'MKR', address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', name: 'Maker' },
    { symbol: 'SNX', address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', name: 'Synthetix' },
    { symbol: 'YFI', address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad9ec', name: 'yearn.finance' },
    { symbol: 'BAL', address: '0xba100000625a3754423978a60c9317c58a424e3d', name: 'Balancer' },
    { symbol: 'REN', address: '0x408e41876cccdc0f92210600ef50372656052a38', name: 'Ren' },
    { symbol: 'ZRX', address: '0xe41d2489571d322189246dafa5ebde1f4699f498', name: '0x Protocol' },
    { symbol: 'BAND', address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55', name: 'Band Protocol' },
    { symbol: 'NMR', address: '0x1776e1f26f98b1a5df9cd347953a26dd3cb46671', name: 'Numeraire' },
    { symbol: 'UMA', address: '0x04fa0d235c4abf4bcf4787af4cf447de572ef828', name: 'UMA' },
    { symbol: 'PERP', address: '0xbc396689893d065f41bc2c6ecbee5e0085233447', name: 'Perpetual Protocol' },
    { symbol: 'ALPHA', address: '0xa1faa113cbe53436df28ff0aee54275c13b40975', name: 'Alpha Finance' },
    { symbol: 'BADGER', address: '0x3472a5a71965499acd81997a54bba8d852c6e53d', name: 'Badger DAO' },
    { symbol: 'FARM', address: '0xa0246c9032bc3a600820415ae600c6388619a14d', name: 'Harvest Finance' },
    { symbol: 'PICKLE', address: '0x429881672b9ae42b8eba0e26cd9c73711b891ca5', name: 'Pickle Finance' },
    { symbol: 'CREAM', address: '0x2ba592f78db6436527729929aaf6c908497cb200', name: 'Cream Finance' },
    { symbol: 'ALCX', address: '0xdbdb4d16eda451d0503b854cf79d55697f90c8df', name: 'Alchemix' },
    { symbol: 'SPELL', address: '0x090185f2135308bad17527004364ebcc2d37e5f6', name: 'Spell Token' },
    { symbol: 'MIM', address: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3', name: 'Magic Internet Money' },
    { symbol: 'FRAX', address: '0x853d955acef822db058eb8505911ed77f175b99e', name: 'Frax' },
    { symbol: 'FEI', address: '0x956f47f50a91036d9b403df229956795a7024ed0', name: 'Fei USD' },
    { symbol: 'RARI', address: '0xfca59cd816ab1ead66534d82bc21e7515ce441cf', name: 'Rarible' },
    { symbol: 'SUPER', address: '0xe53ec727dbdeb9e2d5456c3be40cff031ab40a55', name: 'SuperFarm' },
    { symbol: 'DYDX', address: '0x92d6c1e31e14520e676a687f0a93788b716beff5', name: 'dYdX' },
    { symbol: 'ENS', address: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72', name: 'Ethereum Name Service' },
    { symbol: 'IMX', address: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff', name: 'Immutable X' },
    { symbol: 'OP', address: '0x4200000000000000000000000000000000000042', name: 'Optimism' },
    { symbol: 'ARB', address: '0x912ce59144191c1204e64559fe8253a0e49e6548', name: 'Arbitrum' },
    { symbol: 'PEPE', address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', name: 'Pepe' },
    { symbol: 'BLUR', address: '0x5283d291dbcf85356a21ba090e6db59121208b44', name: 'Blur' },
    { symbol: 'JUP', address: '0x4k3s1f8b1a4c1d1e1f1a1c1d1e1f1a1c1d1e1f1a', name: 'Jupiter' },
    { symbol: 'BONK', address: '0xae2df9f730c54400934c06d1745cdfb4f7abb2f9', name: 'Bonk' },
    { symbol: 'WIF', address: '0x7681f3d9b9e9c9b9e9c9b9e9c9b9e9c9b9e9c9b9', name: 'dogwifhat' },
    { symbol: 'BOME', address: '0xda257cbe1b5b3b7b3b7b3b7b3b7b3b7b3b7b3b7b', name: 'Book of Meme' },
    { symbol: 'DOGE', address: '0x3832d2f059e559d208aad4b7c3d4b7c3d4b7c3d4', name: 'Dogecoin' },
    { symbol: 'LTC', address: '0x5a3e6a77ba2f983ec0d371ea3b475f8bc0811ad5', name: 'Litecoin' },
    { symbol: 'XRP', address: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', name: 'Ripple' },
    { symbol: 'ADA', address: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47', name: 'Cardano' },
    { symbol: 'DOT', address: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402', name: 'Polkadot' },
    { symbol: 'SOL', address: '0x570a5d26f7765ecb712c0924e4de545b89fd43df', name: 'Solana' },
    { symbol: 'AVAX', address: '0x85f138bfee4ef8e540890cfb48f620571d67eda3', name: 'Avalanche' },
    { symbol: 'FTM', address: '0x4e15361fd6b4bb609fa63c81a2be19d873717870', name: 'Fantom' },
    { symbol: 'NEAR', address: '0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4', name: 'NEAR Protocol' },
    { symbol: 'ATOM', address: '0x0eb3a705fc54725037cc9e008bdede697f62f335', name: 'Cosmos' },
    { symbol: 'ALGO', address: '0xa1faa113cbe53436df28ff0aee54275c13b40975', name: 'Algorand' },
    { symbol: 'VET', address: '0x6fdcdfef7c496407ccb60be4142e4e473c92c43b', name: 'VeChain' },
    { symbol: 'ICP', address: '0x8427080f4e2b05a6b2e87b7d9f8e8f8e8f8e8f8e', name: 'Internet Computer' },
    { symbol: 'FIL', address: '0x0d8ce2a99bb6e3b7dbda3d3d3d3d3d3d3d3d3d3d', name: 'Filecoin' },
    { symbol: 'TRX', address: '0x50327c6c5a14dcba7072124e3a5070f6f13f74b5', name: 'TRON' },
    { symbol: 'EOS', address: '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0', name: 'EOS' },
    { symbol: 'BCH', address: '0x8ff795a6f4d97e7887c79bea79aba5cc76444adf', name: 'Bitcoin Cash' },
    { symbol: 'BSV', address: '0x5acd19b9c91e596b1f062f18e3d02da7ed8d1e50', name: 'Bitcoin SV' },
    { symbol: 'XLM', address: '0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd', name: 'Stellar' },
    { symbol: 'XMR', address: '0x465e07d6028830124be2e4aa551fbe12805db0f5', name: 'Monero' },
    { symbol: 'ZEC', address: '0x1c7bd25fe7c60d7b4bec6e9905654512dafe9150', name: 'Zcash' },
    { symbol: 'DASH', address: '0x3832d2f059e559d208aad4b7c3d4b7c3d4b7c3d4', name: 'Dash' },
    { symbol: 'NEO', address: '0x8c23b196209831511f9cb7ecc087e255559cf6b8', name: 'NEO' },
    { symbol: 'QTUM', address: '0x9bdc5f6a8069ac35c0a9ec2ec912f7c477862812', name: 'Qtum' },
    { symbol: 'IOTA', address: '0x6fb3e0a217407efff7ca062d46c26e5d60a14d69', name: 'IOTA' },
    { symbol: 'XTZ', address: '0x2c31bf10ab3977444098b8b31b658e66c4f4f38b', name: 'Tezos' },
    { symbol: 'THETA', address: '0x3883f5e181fccaf8410fa61e12b59bad963fb645', name: 'Theta Token' },
    { symbol: 'VTHO', address: '0x7b64d83c19e0f6fa0d9bb3b4617c7eb675a5a9e3', name: 'VeThor Token' },
    { symbol: 'ONT', address: '0xfd957f21bd95e723645c07c48a2b8a0ebf4a6c0d', name: 'Ontology' },
    { symbol: 'ZIL', address: '0xb86abcb37c3a4b64f74f59301aff131a1becc787', name: 'Zilliqa' },
    { symbol: 'BAT', address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', name: 'Basic Attention Token' },
    { symbol: 'ZEN', address: '0xcb56b52316041a62b6b5d0583dce4a8ae7a3c629', name: 'Horizen' },
    { symbol: 'SC', address: '0x2d9765a94ff22e0c3e00e0c3e00e0c3e00e0c3e0', name: 'Siacoin' },
    { symbol: 'HOT', address: '0x6c6ee5e31d828de241282b9606c8e98ea48526e2', name: 'Holo' },
    { symbol: 'NANO', address: '0x4a8f44be523580a11cdb20e2c7c470adf44ec9bb', name: 'Nano' },
    { symbol: 'ICX', address: '0xb5a5f22694352c15b00323844ad545abb2b11028', name: 'ICON' },
    { symbol: 'WAVES', address: '0x1cf4592ebffd730c7dc92c1bdffdfc3b9efcf516a', name: 'Waves' },
    { symbol: 'OMG', address: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07', name: 'OMG Network' },
    { symbol: 'KNC', address: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', name: 'Kyber Network' },
    { symbol: 'REP', address: '0x1985365e9f78359a9b6ad760e32412f4a445e862', name: 'Augur' },
    { symbol: 'GNT', address: '0xa74476443119a942de498590fe1f2454d7d4ac0d', name: 'Golem' },
    { symbol: 'STORJ', address: '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac', name: 'Storj' },
    { symbol: 'MANA', address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', name: 'Decentraland' },
    { symbol: 'ENJ', address: '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c', name: 'Enjin Coin' },
    { symbol: 'CHZ', address: '0x3506424f91fd33084466f402d5d97f05f8e3b4af', name: 'Chiliz' },
    { symbol: 'ANKR', address: '0x8290333cef9e6d528dd5618fb97a76f268f3edd4', name: 'Ankr' },
    { symbol: 'CKB', address: '0xf1428850f92b87cd62989f496e8544eac37ae7d9', name: 'Nervos Network' },
    { symbol: 'COTI', address: '0xddb3422497e61e13543bea06989c0784127555c5', name: 'COTI' },
    { symbol: 'CTSI', address: '0x491604c0fdf08347dd1fa4ee062a822a5dd06b5d', name: 'Cartesi' },
    { symbol: 'DUSK', address: '0x940a2db1b7008b6c776d4faaca729d6d4a4aa551', name: 'Dusk Network' },
    { symbol: 'FET', address: '0xaea46a60368a7bd060eec7df8cba43b7ef41ad85', name: 'Fetch.ai' },
    { symbol: 'FLOW', address: '0x5c147e74d63b1d31aa3fd78eb229b65161983b2b', name: 'Flow' },
    { symbol: 'FORTH', address: '0x77fba179c79de5b7653f68b5039af940ada60ce0', name: 'Ampleforth Governance' },
    { symbol: 'GHST', address: '0x3f382dbd960e3a9bbceae22651e88158d2791550', name: 'Aavegotchi' },
    { symbol: 'GTC', address: '0xde30da39c46104798bb5aa3fe8b9e0e1f348163f', name: 'Gitcoin' },
    { symbol: 'HIGH', address: '0x71ab77b7dbb4fa7e017bc15090b216322142db2a', name: 'Highstreet' },
    { symbol: 'HOPR', address: '0xf5581dfefd8fb0e4aec526be659cfab1f8c781da', name: 'HOPR' },
    { symbol: 'ILV', address: '0x767fe9edc9e0df98e07454847909b5e959d7ca0e', name: 'Illuvium' },
    { symbol: 'INJ', address: '0xe28b3b32b6c345a34ff64674606124dd5aceca30', name: 'Injective' },
    { symbol: 'KEEP', address: '0x85eee30c52b0b379b046fb0f85f4f3dc3009afec', name: 'Keep Network' },
    { symbol: 'LDO', address: '0x5a98fcbea516cf06857215779fd812ca3bef1b32', name: 'Lido DAO' },
    { symbol: 'LPT', address: '0x58b6a8a3302369daec383334672404ee733ab239', name: 'Livepeer' },
    { symbol: 'LQTY', address: '0x6dea81c8171d0ba574754ef6f8b412f2ed88c54d', name: 'Liquity' },
    { symbol: 'MASK', address: '0x69af81e73a73b40adf4f3d4223cd9b1ece623074', name: 'Mask Network' },
    { symbol: 'MINA', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', name: 'Mina Protocol' },
    { symbol: 'MLN', address: '0xec67005c4e498ec7f55e092bd1d35cbc47c91892', name: 'Enzyme' },
    { symbol: 'NMR', address: '0x1776e1f26f98b1a5df9cd347953a26dd3cb46671', name: 'Numeraire' },
    { symbol: 'OCEAN', address: '0x967da4048cd07ab37855c090aaf366e4ce1b9f48', name: 'Ocean Protocol' },
    { symbol: 'OGN', address: '0x8207c1ffc5b6804f6024322ccf734f0acbcbb10f', name: 'Origin Protocol' },
    { symbol: 'PAXG', address: '0x45804880de22913dafe09f4980848ece6ecbaf78', name: 'PAX Gold' },
    { symbol: 'POLS', address: '0x83e6f1e41cdd28eaceb20cb649155049fac3d5aa', name: 'Polkastarter' },
    { symbol: 'POND', address: '0x57b946008913b82e4df85f501cbaed910e58d26c', name: 'Marlin' },
    { symbol: 'PUNDIX', address: '0x0fd10b9899882a6f2fcb5c371e17e70fdee00c38', name: 'Pundi X' },
    { symbol: 'QNT', address: '0x4a220e6096b25eadb88358cb44068a3248254675', name: 'Quant' },
    { symbol: 'RAD', address: '0x31c8eacbffdd875c74b94b077895bd78cf1e64a3', name: 'Radicle' },
    { symbol: 'RARE', address: '0xba5bde662c17e2adff1075610382b9b6caece2ba', name: 'SuperRare' },
    { symbol: 'RLC', address: '0x607f4c5bb672230e8672085532f7e901544a7375', name: 'iExec RLC' },
    { symbol: 'RSR', address: '0x8762db106b2c2a0bccb3a80d1ed41273552616e8', name: 'Reserve Rights' },
    { symbol: 'SAND', address: '0x3845badade8e6dff049820680d1f14bd3903a5d0', name: 'The Sandbox' },
    { symbol: 'SKL', address: '0x00c83aecc790e8a4453e5dd3b0b4b3680501a7a7', name: 'SKALE' },
    { symbol: 'SLP', address: '0x070a08beef8d36734dd67a491202ff35a6a16d97', name: 'Smooth Love Potion' },
    { symbol: 'SNT', address: '0x744d70fdbe2ba4cf95131626614a1763df805b9e', name: 'Status' },
    { symbol: 'STX', address: '0xa5c3a513645a9a00cb561fed40438e9dfc0c10ce', name: 'Stacks' },
    { symbol: 'SUKU', address: '0x0763fdccf1ae541a5961815c0873a6c5314ac06d', name: 'SUKU' },
    { symbol: 'SXP', address: '0x8ce9137d39326ad0cd6491fb5cc0cba0e089b6a9', name: 'SXP' },
    { symbol: 'TRIBE', address: '0xc7283b66eb1eb5fb86327f08e1b5816b0720212b', name: 'Tribe' },
    { symbol: 'TRU', address: '0x4c19596f5aaff459fa38b0f7ed92f11ae6543784', name: 'TrueFi' },
    { symbol: 'UFO', address: '0x249e38ea4102d0cf8264d3701f1a0e39c4f2dc3b', name: 'UFO Gaming' },
    { symbol: 'UNFI', address: '0x728c5bac3c3e370e372fc4671f9ef6916b814d8b', name: 'Unifi Protocol DAO' },
    { symbol: 'USDP', address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1', name: 'Pax Dollar' },
    { symbol: 'VGX', address: '0x3c4b6e6e1ea3d4863700d7f76b36b7f3d3b13c3a', name: 'Voyager Token' },
    { symbol: 'WOO', address: '0x4691937a7508860f876c9c0a2a617e7d9e945d4b', name: 'WOO Network' },
    { symbol: 'YGG', address: '0x25f8087ead173b73d6e8b84329989a8eea16cf73', name: 'Yield Guild Games' },
    { symbol: 'ZEN', address: '0xcb56b52316041a62b6b5d0583dce4a8ae7a3c629', name: 'Horizen' },
    { symbol: 'ZRX', address: '0xe41d2489571d322189246dafa5ebde1f4699f498', name: '0x Protocol' }
  ]

  // Define the specific DEXs we want to track
  const targetDexs = [
    { id: 'uniswap-v2', name: 'Uniswap V2', chain: 'ethereum' },
    { id: 'sushiswap', name: 'SushiSwap', chain: 'ethereum' },
    { id: 'quickswap', name: 'QuickSwap', chain: 'polygon' },
    { id: 'spookyswap', name: 'SpookySwap', chain: 'fantom' },
    { id: 'pancakeswap', name: 'PancakeSwap', chain: 'bsc' },
    { id: 'traderjoe', name: 'TraderJoe', chain: 'avalanche' }
  ]

  const allPairs: DexScreenerPairRow[] = []

  // Fetch data for each popular token
  for (const token of popularTokens) {
    try {
      console.log(`Fetching real-time data for ${token.symbol}...`)
      const pairs = await fetchDexScreenerPairsByTokenAddress(token.address)
      
      // Filter for our target DEXs and chains
      const filteredPairs = pairs.filter(pair => {
        const isTargetDex = targetDexs.some(dex => 
          pair.dexId.toLowerCase().includes(dex.id.toLowerCase()) && 
          pair.chainId.toLowerCase() === dex.chain.toLowerCase()
        )
        const isTargetChain = chains.map(c => c.toLowerCase()).includes(pair.chainId.toLowerCase())
        return isTargetDex && isTargetChain
      })

      allPairs.push(...filteredPairs)
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`Failed to fetch data for ${token.symbol}:`, error)
    }
  }

  // If we didn't get enough data from specific token queries, try broader searches
  if (allPairs.length < 20) {
    console.log('Fetching additional data with broader search...')
    const additionalQueries = ['USDT', 'USDC', 'DAI']
    const settled = await Promise.allSettled(additionalQueries.map((q) => searchPairs(q)))
    
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        const filtered = s.value.filter((r) => {
          const isTargetDex = targetDexs.some(dex => 
            r.dexId.toLowerCase().includes(dex.id.toLowerCase()) && 
            r.chainId.toLowerCase() === dex.chain.toLowerCase()
          )
          const isTargetChain = chains.map(c => c.toLowerCase()).includes(r.chainId.toLowerCase())
          return isTargetDex && isTargetChain
        })
        allPairs.push(...filtered)
      }
    }
  }

  // Deduplicate by chain:dex:baseAddress
  const seen = new Set<string>()
  const unique: DexScreenerPairRow[] = []
  for (const r of allPairs) {
    const key = `${r.chainId}:${r.dexId}:${r.baseToken.address}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(r)
  }

  console.log(`Fetched ${unique.length} real-time pairs from DEXs`)
  return unique
}

// New function to fetch data directly from specific DEX APIs
async function fetchDirectFromDexs(): Promise<DexScreenerPairRow[]> {
  const pairs: DexScreenerPairRow[] = []
  
  // Popular token addresses
  const tokens = [
    { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', name: 'Wrapped Ether' },
    { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap' },
    { symbol: 'LINK', address: '0x514910771af9ca656af840dff83e8264ecf986ca', name: 'Chainlink' },
    { symbol: 'MATIC', address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', name: 'Polygon' },
    { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', name: 'Wrapped Bitcoin' }
  ]

  // Fetch from DexScreener for each token
  for (const token of tokens) {
    try {
      const tokenPairs = await fetchDexScreenerPairsByTokenAddress(token.address)
      pairs.push(...tokenPairs)
      await new Promise(resolve => setTimeout(resolve, 100)) // Rate limiting
    } catch (error) {
      console.error(`Failed to fetch ${token.symbol}:`, error)
    }
  }

  return pairs
}


export default {
  fetchDexScreenerPairsByTokenAddress,
  resolveTokenAddress,
  fetchUsdtPairsForChains,
  fetchDirectFromDexs,
}
