import { NextRequest, NextResponse } from 'next/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function GET(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    // Test Paystack API connection by fetching balance
    const response = await fetch('https://api.paystack.co/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paystack Balance Error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to fetch balance' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      balance: data.data,
      message: 'Paystack API connection successful'
    })

  } catch (error) {
    console.error('Paystack Test Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

