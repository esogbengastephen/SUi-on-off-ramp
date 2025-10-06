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

    const { searchParams } = new URL(request.url)
    const transferId = searchParams.get('transferId')

    if (!transferId) {
      return NextResponse.json(
        { error: 'Transfer ID is required' },
        { status: 400 }
      )
    }

    // Fetch transfer status from Paystack
    const response = await fetch(`https://api.paystack.co/transfer/${transferId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paystack Transfer Status Error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to fetch transfer status' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      transfer: data.data
    })

  } catch (error) {
    console.error('Transfer Status API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}