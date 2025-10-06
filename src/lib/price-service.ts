// Price Service for CoinMarketCap API Integration
import axios from 'axios'

// Token configuration with real Sui addresses
export const TOKEN_CONFIG = {
  SUI: {
    address: '0x2::sui::SUI',
    coinmarketcapId: '20947', // SUI token ID on CoinMarketCap
    coingeckoId: 'sui',
    decimals: 9,
    symbol: 'SUI',
    name: 'Sui'
  },
  USDC: {
    address: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    coinmarketcapId: '3408', // USDC token ID on CoinMarketCap
    coingeckoId: 'usd-coin',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin'
  },
  USDT: {
    address: '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT',
    coinmarketcapId: '825', // USDT token ID on CoinMarketCap
    coingeckoId: 'tether',
    decimals: 6,
    symbol: 'USDT',
    name: 'Tether'
  }
} as const

export type TokenSymbol = keyof typeof TOKEN_CONFIG

// Price data interface
export interface PriceData {
  symbol: string
  price: number
  change24h: number
  lastUpdated: number
  isOverride?: boolean
  source?: string
}

// Price service class
class PriceService {
  private cache: Map<string, PriceData> = new Map()
  private updateInterval: NodeJS.Timeout | null = null
  private readonly CACHE_DURATION = 30000 // 30 seconds
  private readonly UPDATE_INTERVAL = 30000 // 30 seconds

  constructor() {
    this.startPriceUpdates()
  }

  // Get price for a specific token
  async getPrice(tokenSymbol: TokenSymbol, transactionType?: 'ON_RAMP' | 'OFF_RAMP'): Promise<PriceData | null> {
    const cacheKey = transactionType ? `${tokenSymbol}_${transactionType}` : tokenSymbol
    const cached = this.cache.get(cacheKey)
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.lastUpdated < this.CACHE_DURATION) {
      return cached
    }

    // Fetch fresh data
    try {
      const priceData = await this.fetchPriceFromAPI(tokenSymbol, transactionType)
      if (priceData) {
        this.cache.set(cacheKey, priceData)
        return priceData
      }
    } catch (error) {
      console.error(`Error fetching price for ${tokenSymbol}:`, error)
    }

    // Return cached data even if stale
    return cached || null
  }

  // Get prices for multiple tokens
  async getPrices(tokenSymbols: TokenSymbol[]): Promise<Map<TokenSymbol, PriceData>> {
    const prices = new Map<TokenSymbol, PriceData>()
    
    // Fetch all prices in parallel
    const promises = tokenSymbols.map(async (symbol) => {
      const price = await this.getPrice(symbol)
      if (price) {
        prices.set(symbol, price)
      }
    })

    await Promise.all(promises)
    return prices
  }

  // Fetch price from our API route
  private async fetchPriceFromAPI(tokenSymbol: TokenSymbol, transactionType?: 'ON_RAMP' | 'OFF_RAMP'): Promise<PriceData | null> {
    try {
      // Use absolute URL for client-side requests
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const typeParam = transactionType ? `&type=${transactionType}` : ''
      const response = await axios.get(`${baseUrl}/api/prices/${tokenSymbol.toLowerCase()}?${typeParam}`, {
        timeout: 5000 // Reduced timeout to 5 seconds
      })

      if (response.data && response.data.price) {
        return {
          symbol: tokenSymbol,
          price: response.data.price,
          change24h: response.data.change24h || 0,
          lastUpdated: Date.now(),
          isOverride: response.data.isOverride || false,
          source: response.data.source || 'api'
        }
      }

      return null
    } catch (error) {
      console.error(`Error fetching price from API for ${tokenSymbol}:`, error)
      // Return fallback price data
      return this.getFallbackPrice(tokenSymbol)
    }
  }

  // Fallback price data when API fails
  private getFallbackPrice(tokenSymbol: TokenSymbol): PriceData {
    const fallbackPrices = {
      SUI: { price: 3000, change24h: 0 }, // ₦3,000 per SUI
      USDC: { price: 1500, change24h: 0 }, // ₦1,500 per USDC
      USDT: { price: 1500, change24h: 0 }  // ₦1,500 per USDT
    }

    const fallback = fallbackPrices[tokenSymbol]
    return {
      symbol: tokenSymbol,
      price: fallback.price,
      change24h: fallback.change24h,
      lastUpdated: Date.now()
    }
  }

  // Start automatic price updates
  private startPriceUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    this.updateInterval = setInterval(async () => {
      try {
        // Update all token prices
        const tokenSymbols = Object.keys(TOKEN_CONFIG) as TokenSymbol[]
        await this.getPrices(tokenSymbols)
      } catch (error) {
        console.error('Error updating prices:', error)
      }
    }, this.UPDATE_INTERVAL)
  }

  // Stop automatic price updates
  stopPriceUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  // Get cached price (synchronous)
  getCachedPrice(tokenSymbol: TokenSymbol): PriceData | null {
    return this.cache.get(tokenSymbol) || null
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }
}

// Create singleton instance
export const priceService = new PriceService()

// Utility function to calculate exchange rate
export function calculateExchangeRate(
  fromToken: TokenSymbol,
  toToken: 'NAIRA',
  amount: number,
  priceData: PriceData
): number {
  if (toToken === 'NAIRA') {
    return amount * priceData.price
  }
  
  // For future token-to-token conversions
  return amount
}

// Utility function to calculate reverse exchange rate (Naira to Token)
export function calculateReverseExchangeRate(
  fromCurrency: 'NAIRA',
  toToken: TokenSymbol,
  nairaAmount: number,
  priceData: PriceData
): number {
  if (fromCurrency === 'NAIRA' && priceData.price > 0) {
    return nairaAmount / priceData.price
  }
  
  return 0
}

// Utility function to convert NGN to USD (approximate)
export function convertNGNToUSD(ngnAmount: number): number {
  // Approximate conversion rate (this should be updated with real exchange rate)
  return ngnAmount / 1500
}

// Utility function to convert USD to NGN (approximate)
export function convertUSDToNGN(usdAmount: number): number {
  // Approximate conversion rate (this should be updated with real exchange rate)
  return usdAmount * 1500
}

// Utility function to format price
export function formatPrice(price: number, currency: string = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

// Utility function to format percentage change
export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}
