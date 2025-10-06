import { NextRequest, NextResponse } from 'next/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    const { recipientCode, amount, reason, reference } = await request.json()

    if (!recipientCode || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientCode, amount, reason' },
        { status: 400 }
      )
    }

    // Generate transfer reference if not provided
    const transferReference = reference || `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Initiate transfer
    const response = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(amount * 100), // Convert to kobo (Paystack expects amounts in kobo)
        recipient: recipientCode,
        reason: reason,
        reference: transferReference
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paystack Transfer Error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to initiate transfer' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      transfer: data.data
    })

  } catch (error) {
    console.error('Transfer API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
