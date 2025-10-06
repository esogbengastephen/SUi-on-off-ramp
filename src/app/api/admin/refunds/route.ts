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

    const { transactionId, userAddress, suiAmount, nairaAmount, reason } = await request.json()

    if (!transactionId || !userAddress || !suiAmount || !nairaAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, userAddress, suiAmount, nairaAmount' },
        { status: 400 }
      )
    }

    console.log('🚀 EXECUTOR: Processing refund for failed transaction:', {
      transactionId,
      userAddress,
      suiAmount,
      nairaAmount,
      reason
    })

    // Create a refund transaction record
    const refundRecord = {
      id: `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalTransactionId: transactionId,
      type: 'REFUND' as const,
      status: 'PENDING' as const,
      suiAmount: suiAmount,
      nairaAmount: nairaAmount,
      userAddress: userAddress,
      createdAt: Date.now(),
      reason: reason || 'Failed Paystack transfer - insufficient admin wallet funds',
      refundType: 'SUI_TO_NAIRA_FAILED_TRANSFER'
    }

    // For now, we'll just log the refund request
    // In a real implementation, this would:
    // 1. Verify the original transaction failed due to insufficient funds
    // 2. Process the refund through the appropriate channels
    // 3. Update the user's account accordingly

    console.log('✅ EXECUTOR: Refund request logged:', refundRecord)

    return NextResponse.json({
      success: true,
      refund: refundRecord,
      message: 'Refund request logged successfully. Admin will process manually.'
    })

  } catch (error) {
    console.error('❌ EXECUTOR: Refund API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all refund requests for admin review
    console.log('🚀 EXECUTOR: Fetching refund requests for admin review')
    
    // In a real implementation, this would fetch from a database
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      refunds: [],
      message: 'No refund requests found'
    })

  } catch (error) {
    console.error('❌ EXECUTOR: Refund fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
