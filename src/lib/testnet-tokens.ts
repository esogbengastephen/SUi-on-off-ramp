// Sui Testnet Token Configuration
export const TESTNET_TOKENS = {
  SUI: {
    address: "0x2::sui::SUI",
    symbol: "SUI",
    name: "Sui",
    decimals: 9,
    icon: "🟡"
  },
  USDC: {
    address: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bfc::coin::COIN",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    icon: "🔵"
  },
  USDT: {
    address: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    icon: "🟢"
  }
} as const

export type TestnetTokenSymbol = keyof typeof TESTNET_TOKENS

// Get token address by symbol
export function getTestnetTokenAddress(symbol: TestnetTokenSymbol): string {
  return TESTNET_TOKENS[symbol].address
}

// Get token info by symbol
export function getTestnetTokenInfo(symbol: TestnetTokenSymbol) {
  return TESTNET_TOKENS[symbol]
}

// Get all available testnet tokens
export function getAllTestnetTokens() {
  return Object.values(TESTNET_TOKENS)
}

// Check if a token is supported on testnet
export function isTestnetTokenSupported(symbol: string): symbol is TestnetTokenSymbol {
  return symbol in TESTNET_TOKENS
}

// Format token amount with proper decimals
export function formatTestnetTokenAmount(amount: number, symbol: TestnetTokenSymbol): string {
  const token = TESTNET_TOKENS[symbol]
  const formattedAmount = (amount / Math.pow(10, token.decimals)).toFixed(6)
  return `${formattedAmount} ${token.symbol}`
}

// Convert from smallest unit to display unit
export function fromSmallestUnit(amount: number, symbol: TestnetTokenSymbol): number {
  const token = TESTNET_TOKENS[symbol]
  return amount / Math.pow(10, token.decimals)
}

// Convert from display unit to smallest unit
export function toSmallestUnit(amount: number, symbol: TestnetTokenSymbol): number {
  const token = TESTNET_TOKENS[symbol]
  return Math.floor(amount * Math.pow(10, token.decimals))
}
