import { NextRequest, NextResponse } from 'next/server';

// CoinMarketCap API configuration
const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY || 'your-api-key-here';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Token ID mapping for CoinMarketCap
const CMC_TOKEN_IDS = {
  sui: '20947',    // SUI token ID on CoinMarketCap
  usdc: '3408',    // USDC token ID on CoinMarketCap  
  usdt: '825'      // USDT token ID on CoinMarketCap
};

// USD to NGN conversion rate (should be updated regularly)
const USD_TO_NGN_RATE = 1650; // Approximate rate, should be fetched from forex API

// Fallback prices in case API fails (in NGN)
const FALLBACK_PRICES = {
  sui: 4850,
  usdc: 1650,
  usdt: 1650
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // During build time, return fallback data immediately to avoid Firebase issues
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      const { token } = await params;
      const tokenLower = token.toLowerCase();
      
      const fallbackPrices = {
        sui: { price: 3000, change24h: 0 },
        usdc: { price: 1500, change24h: 0 },
        usdt: { price: 1500, change24h: 0 }
      };

      const fallbackData = {
        symbol: tokenLower.toUpperCase(),
        price: fallbackPrices[tokenLower as keyof typeof fallbackPrices]?.price || 1000,
        change24h: 0,
        lastUpdated: Date.now(),
        source: 'build-time-fallback'
      };

      return NextResponse.json(fallbackData);
    }

    const { token } = await params;
    const tokenLower = token.toLowerCase();
    
    if (!['sui', 'usdc', 'usdt'].includes(tokenLower)) {
      return NextResponse.json(
        { error: 'Unsupported token' },
        { status: 400 }
      );
    }

    // Check for price override first
    const url = new URL(request.url);
    const transactionType = url.searchParams.get('type'); // 'ON_RAMP' or 'OFF_RAMP'
    
    // Check Firebase for price overrides (only if Firebase is available)
    let overridePrice = null;
    let overrideSource = null;
    
    try {
      // Dynamic import to avoid build-time issues
      const { db } = await import('@/lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const priceOverrideDoc = await getDoc(doc(db, 'systemSettings', 'priceOverrides'));
      if (priceOverrideDoc.exists()) {
        const overrides = priceOverrideDoc.data();
        const tokenOverrides = overrides[tokenLower.toUpperCase()];
        
        if (tokenOverrides && transactionType) {
          const typeKey = transactionType === 'ON_RAMP' ? 'onRamp' : 'offRamp';
          if (tokenOverrides[typeKey]?.enabled && tokenOverrides[typeKey]?.price > 0) {
            overridePrice = tokenOverrides[typeKey].price;
            overrideSource = `${transactionType.toLowerCase()}_override`;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check price overrides:', error);
    }
    
    // If override exists, return it
    if (overridePrice) {
      return NextResponse.json({
        token: tokenLower.toUpperCase(),
        price: Math.round(overridePrice * 100) / 100,
        currency: 'NGN',
        source: overrideSource,
        transactionType: transactionType || 'general',
        isOverride: true,
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Try to fetch real-time price from CoinMarketCap
    let price = FALLBACK_PRICES[token as keyof typeof FALLBACK_PRICES];
    let source = 'fallback';

    try {
      const tokenId = CMC_TOKEN_IDS[token as keyof typeof CMC_TOKEN_IDS];
      const apiUrl = `${CMC_BASE_URL}?id=${tokenId}&convert=USD`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          'User-Agent': 'SUI-Swap-Admin/1.0'
        },
        next: { revalidate: 60 } // Cache for 1 minute
      });

      if (response.ok) {
        const data = await response.json();
        
        // Extract USD price and convert to NGN
        if (data.data && data.data[tokenId]) {
          const usdPrice = data.data[tokenId].quote.USD.price;
          price = usdPrice * USD_TO_NGN_RATE;
          source = 'coinmarketcap';
        }
      }
    } catch (apiError) {
      console.warn(`Failed to fetch ${token} price from CoinMarketCap:`, apiError);
      // Will use fallback price
    }

    return NextResponse.json({
      token: token.toUpperCase(),
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      currency: 'NGN',
      source,
      transactionType: transactionType || 'general',
      isOverride: false,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Price API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price' },
      { status: 500 }
    );
  }
}

// POST endpoint for manual price override (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const tokenLower = token.toLowerCase();
    const body = await request.json();
    
    if (!['sui', 'usdc', 'usdt'].includes(tokenLower)) {
      return NextResponse.json(
        { error: 'Unsupported token' },
        { status: 400 }
      );
    }

    const { price, adminAddress, reason } = body;

    if (!price || !adminAddress) {
      return NextResponse.json(
        { error: 'Price and admin address are required' },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Verify admin permissions
    // 2. Store the override in Firebase
    // 3. Log the action for audit

    console.log(`Price override for ${token}: ₦${price} by ${adminAddress}. Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      token: token.toUpperCase(),
      overridePrice: price,
      setBy: adminAddress,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Price override error:', error);
    return NextResponse.json(
      { error: 'Failed to set price override' },
      { status: 500 }
    );
  }
}
