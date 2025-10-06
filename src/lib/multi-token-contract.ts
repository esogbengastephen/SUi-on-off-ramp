// Multi-Token Contract Configuration
// This file contains the configuration for the new multi-token smart contract

export const MULTI_TOKEN_CONTRACT = {
  packageId: "0xf81c4b99ae5651bd3f8a4ace96385007a3662cb829af5331c8681fd493b7a054",
  moduleName: "multi_token_swap",
  contractId: "0x319fd0be973e120f0b8944d625708278e5d2f211458b0767adb03d340408c219",
  treasuryId: "0xca821bdc91c8fa60f78aec522094b126bd23095ff6b622ed6e079d19163f5a4f",
  adminCapId: "0x5fc86552859a05e78a10a9183556742ec0efea524b581865b96d0a7675f5b343",
} as const;

export const SUPPORTED_TOKENS = {
  SUI: {
    symbol: "SUI",
    name: "Sui",
    address: "0x2::sui::SUI",
    decimals: 9,
    minAmount: "1000000000", // 1 SUI
    maxAmount: "100000000000000", // 100,000 SUI
    icon: "🟡"
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC",
    decimals: 6,
    minAmount: "1000000", // 1 USDC
    maxAmount: "100000000000", // 100,000 USDC
    icon: "🔵"
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdt::USDT",
    decimals: 6,
    minAmount: "1000000", // 1 USDT
    maxAmount: "100000000000", // 100,000 USDT
    icon: "🟢"
  },
} as const;

export type SupportedTokenSymbol = keyof typeof SUPPORTED_TOKENS;

// Initial exchange rates (in Naira per token with 6-decimal precision)
export const INITIAL_EXCHANGE_RATES = {
  SUI: 5853000000, // ₦5,853
  USDC: 1649000000, // ₦1,649
  USDT: 1650000000, // ₦1,650
} as const;

// Helper functions
export function getTokenAddress(symbol: SupportedTokenSymbol): string {
  return SUPPORTED_TOKENS[symbol].address;
}

export function getTokenInfo(symbol: SupportedTokenSymbol) {
  return SUPPORTED_TOKENS[symbol];
}

export function getAllSupportedTokens() {
  return Object.values(SUPPORTED_TOKENS);
}

export function isTokenSupported(symbol: string): symbol is SupportedTokenSymbol {
  return symbol in SUPPORTED_TOKENS;
}

export function formatTokenAmount(amount: number, symbol: SupportedTokenSymbol): string {
  const token = SUPPORTED_TOKENS[symbol];
  const formattedAmount = (amount / Math.pow(10, token.decimals)).toFixed(6);
  return `${formattedAmount} ${token.symbol}`;
}

export function fromSmallestUnit(amount: number, symbol: SupportedTokenSymbol): number {
  const token = SUPPORTED_TOKENS[symbol];
  return amount / Math.pow(10, token.decimals);
}

export function toSmallestUnit(amount: number, symbol: SupportedTokenSymbol): number {
  const token = SUPPORTED_TOKENS[symbol];
  return Math.floor(amount * Math.pow(10, token.decimals));
}
