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

    const { accountNumber, bankCode, accountName } = await request.json()

    if (!accountNumber || !bankCode || !accountName) {
      return NextResponse.json(
        { error: 'Missing required fields: accountNumber, bankCode, accountName' },
        { status: 400 }
      )
    }

    // Create transfer recipient
    const response = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paystack Transfer Recipient Error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to create transfer recipient' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      recipient: data.data
    })

  } catch (error) {
    console.error('Transfer Recipient API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
