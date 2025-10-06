import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET() {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    // Call Paystack API to get list of banks
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.data.status) {
      return NextResponse.json({
        success: true,
        banks: response.data.data,
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to fetch banks' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Banks fetch error:', error)
    
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
