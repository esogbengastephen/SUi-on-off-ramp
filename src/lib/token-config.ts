// Token configuration for Sui testnet
export interface TokenConfig {
  symbol: string
  name: string
  address: string
  decimals: number
  icon: string
  color: string
}

export const TOKEN_CONFIGS: Record<string, TokenConfig> = {
  SUI: {
    symbol: 'SUI',
    name: 'Sui',
    address: '0x2::sui::SUI', // Native SUI token
    decimals: 9,
    icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaLNgIK-JvhE1NrCIqtL4Szrl06iLcQyXOn4zefdjzd6UH1RvrID7aCdUwTImuFDbmT3D05x4dD9vH95GFeyCiEjBQneMA8MFfUkfSdNOVb1fm_0WR-2bAGVEYYya4r3s4qJLA4dcldLaYwWv0C0ReVlC4lbipKsMloJjZ9bqq0QBG93Pn5Qb0LiBoiixMSB7mOCIQa2nbPAtpw7v-3biJGYRji7BLgFQ6Iyfe-symet5R9YjpLFxvD6H6Et6Kt-h59CGKD4QTEzl2',
    color: '#4F46E5'
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', // Testnet USDC
    decimals: 6,
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMwMDUyRkYiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJTNi40NzcgMjIgMTIgMjJTMjIgMTcuNTIzIDIyIDEyUzE3LjUyMyAyIDEyIDJaTTEyIDIwQzcuNTg5IDIwIDQgMTYuNDExIDQgMTJTNy41ODkgNCAxMiA0UzIwIDcuNTg5IDIwIDEyUzE2LjQxMSAyMCAxMiAyMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMiA2QzguNjg2IDYgNiA4LjY4NiA2IDEyUzguNjg2IDE4IDEyIDE4UzE4IDE1LjMxNCAxOCAxMlMxNS4zMTQgNiAxMiA2Wk0xMiAxNkM5Ljc5IDE2IDggMTQuMjEgOCAxMlM5Ljc5IDggMTIgOFMxNiA5Ljc5IDE2IDEyUzE0LjIxIDE2IDEyIDE2WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=',
    color: '#2775CA'
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08::coin::COIN', // Testnet USDT
    decimals: 6,
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMyNkE5RUEiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJTNi40NzcgMjIgMTIgMjJTMjIgMTcuNTIzIDIyIDEyUzE3LjUyMyAyIDEyIDJaTTEyIDIwQzcuNTg5IDIwIDQgMTYuNDExIDQgMTJTNy41ODkgNCAxMiA0UzIwIDcuNTg5IDIwIDEyUzE2LjQxMSAyMCAxMiAyMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMiA2QzguNjg2IDYgNiA4LjY4NiA2IDEyUzguNjg2IDE4IDEyIDE4UzE4IDE1LjMxNCAxOCAxMlMxNS4zMTQgNiAxMiA2Wk0xMiAxNkM5Ljc5IDE2IDggMTQuMjEgOCAxMlM5Ljc5IDggMTIgOFMxNiA5Ljc5IDE2IDEyUzE0LjIxIDE2IDEyIDE2WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo=',
    color: '#26A9EA'
  }
}

export function getTokenConfig(symbol: string): TokenConfig | undefined {
  return TOKEN_CONFIGS[symbol]
}

export function getAllTokenConfigs(): TokenConfig[] {
  return Object.values(TOKEN_CONFIGS)
}

// Token conversion rates (relative to SUI) - REMOVED: Each token has its own price
// export const TOKEN_RATES: Record<string, number> = {
//   SUI: 1.0,    // Base rate
//   USDC: 0.5,   // 1 USDC = 0.5 SUI equivalent
//   USDT: 0.5    // 1 USDT = 0.5 SUI equivalent
// }

// Note: Each token now has its own independent price from the price API
// No artificial rate conversion needed
