import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Simple in-memory cache to reduce API calls
const accountCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { accountNumber, bankCode } = await request.json()

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: 'Account number and bank code are required' },
        { status: 400 }
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    // Check cache first
    const cacheKey = `${accountNumber}-${bankCode}`
    const cached = accountCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        accountName: cached.data.account_name,
        accountNumber: cached.data.account_number,
        bankCode: cached.data.bank_code,
        cached: true,
      })
    }

    // Call Paystack API to resolve account number with retry logic
    let response
    let retries = 3
    
    while (retries > 0) {
      try {
        response = await axios.get(
          `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout
          }
        )
        break // Success, exit retry loop
      } catch (error: any) {
        if (error.response?.status === 429 && retries > 1) {
          // Rate limited, wait and retry
          console.log(`Rate limited, retrying in ${(4 - retries) * 1000}ms...`)
          await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000))
          retries--
          continue
        }
        throw error // Re-throw if not rate limit or no more retries
      }
    }

    if (!response) {
      throw new Error('Failed to get response after retries')
    }

    if (response.data.status) {
      // Cache the successful response
      accountCache.set(cacheKey, {
        data: response.data.data,
        timestamp: Date.now()
      })

      return NextResponse.json({
        success: true,
        accountName: response.data.data.account_name,
        accountNumber: response.data.data.account_number,
        bankCode: response.data.data.bank_code,
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to resolve account' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Account verification error:', error)
    
    // Handle specific error cases
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }
    
    if (error.response?.status === 400) {
      return NextResponse.json(
        { error: 'Invalid account number or bank code' },
        { status: 400 }
      )
    }
    
    if (error.response?.data?.message) {
      return NextResponse.json(
        { error: error.response.data.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
