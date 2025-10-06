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

    console.log('🚀 EXECUTOR: Checking Paystack wallet balance...')

    // Get Paystack balance
    const response = await fetch('https://api.paystack.co/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ EXECUTOR: Paystack Balance Error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to get balance' },
        { status: response.status }
      )
    }

    console.log('✅ EXECUTOR: Paystack balance retrieved:', data.data)

    return NextResponse.json({
      success: true,
      balance: data.data
    })

  } catch (error) {
    console.error('❌ EXECUTOR: Balance API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
