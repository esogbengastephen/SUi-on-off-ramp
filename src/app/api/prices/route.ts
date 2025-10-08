import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { TOKEN_CONFIG, TokenSymbol } from '@/lib/price-service'

// Cache for storing price data
const priceCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenSymbol = searchParams.get('token') as TokenSymbol
  
  if (!tokenSymbol || !TOKEN_CONFIG[tokenSymbol]) {
    return NextResponse.json({ error: 'Invalid token symbol' }, { status: 400 })
  }

  // During build time or production, return fallback data immediately to avoid timeouts
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true' || process.env.VERCEL === 'true') {
    const fallbackPrices = {
      SUI: { price: 3000, change24h: 0 },
      USDC: { price: 1500, change24h: 0 },
      USDT: { price: 1500, change24h: 0 }
    }

    const fallbackData = {
      symbol: tokenSymbol,
      price: fallbackPrices[tokenSymbol].price,
      change24h: fallbackPrices[tokenSymbol].change24h,
      lastUpdated: Date.now(),
      source: 'build-time-fallback'
    }

    return NextResponse.json(fallbackData)
  }

  try {
    // Check cache first
    const cacheKey = `price_${tokenSymbol}`
    const cached = priceCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // Try CoinMarketCap first with shorter timeout
    let priceData = null
    
    try {
      priceData = await fetchFromCoinMarketCap(tokenSymbol)
    } catch (error) {
      console.log('CoinMarketCap failed, trying CoinGecko fallback...')
      // Fallback to CoinGecko
      try {
        priceData = await fetchFromCoinGecko(tokenSymbol)
      } catch (fallbackError) {
        console.log('Both APIs failed, using fallback data')
        priceData = null
      }
    }

    if (priceData) {
      // Cache the result
      priceCache.set(cacheKey, {
        data: priceData,
        timestamp: Date.now()
      })
      
      return NextResponse.json(priceData)
    }

    // Return fallback price data
    const fallbackPrices = {
      SUI: { price: 3000, change24h: 0 },
      USDC: { price: 1500, change24h: 0 },
      USDT: { price: 1500, change24h: 0 }
    }

    const fallbackData = {
      symbol: tokenSymbol,
      price: fallbackPrices[tokenSymbol].price,
      change24h: fallbackPrices[tokenSymbol].change24h,
      lastUpdated: Date.now(),
      source: 'fallback'
    }

    return NextResponse.json(fallbackData)

  } catch (error) {
    console.error('Price fetch error:', error)
    
    // Return fallback price data even on error
    const fallbackPrices = {
      SUI: { price: 3000, change24h: 0 },
      USDC: { price: 1500, change24h: 0 },
      USDT: { price: 1500, change24h: 0 }
    }

    const fallbackData = {
      symbol: tokenSymbol,
      price: fallbackPrices[tokenSymbol].price,
      change24h: fallbackPrices[tokenSymbol].change24h,
      lastUpdated: Date.now(),
      source: 'fallback'
    }

    return NextResponse.json(fallbackData)
  }
}

async function fetchFromCoinMarketCap(tokenSymbol: TokenSymbol) {
  const apiKey = process.env.COINMARKETCAP_API_KEY || '79f81226-23f0-4330-97c3-6eca997fcefb'
  const apiUrl = process.env.COINMARKETCAP_API_URL || 'https://pro-api.coinmarketcap.com/v1'
  
  if (!apiKey) {
    throw new Error('CoinMarketCap API key not configured')
  }

  const tokenConfig = TOKEN_CONFIG[tokenSymbol]
  const response = await axios.get(`${apiUrl}/cryptocurrency/quotes/latest`, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      'Accept': 'application/json'
    },
    params: {
      id: tokenConfig.coinmarketcapId,
      convert: 'NGN'
    },
    timeout: 2000
  })

  if (response.data?.data?.[tokenConfig.coinmarketcapId]) {
    const data = response.data.data[tokenConfig.coinmarketcapId]
    const quote = data.quote.NGN

    return {
      symbol: tokenSymbol,
      price: quote.price,
      change24h: quote.percent_change_24h || 0,
      lastUpdated: Date.now(),
      source: 'coinmarketcap'
    }
  }

  throw new Error('No data from CoinMarketCap')
}

async function fetchFromCoinGecko(tokenSymbol: TokenSymbol) {
  const apiUrl = 'https://api.coingecko.com/api/v3'
  const tokenConfig = TOKEN_CONFIG[tokenSymbol]

  const response = await axios.get(`${apiUrl}/simple/price`, {
    params: {
      ids: tokenConfig.coingeckoId,
      vs_currencies: 'ngn',
      include_24hr_change: true
    },
    timeout: 2000
  })

  if (response.data?.[tokenConfig.coingeckoId]) {
    const data = response.data[tokenConfig.coingeckoId]

    return {
      symbol: tokenSymbol,
      price: data.ngn,
      change24h: data.ngn_24h_change || 0,
      lastUpdated: Date.now(),
      source: 'coingecko'
    }
  }

  throw new Error('No data from CoinGecko')
}
