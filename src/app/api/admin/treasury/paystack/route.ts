import { NextRequest, NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    // During build time, return success to avoid Firebase issues
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build-time response - Paystack service not available',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🚀 PAYSTACK DEPOSIT: Processing Naira deposit request');

    const body = await request.json();
    const { 
      amount, 
      email, 
      bankCode, 
      accountNumber,
      accountName,
      description = 'Naira deposit to treasury'
    } = body;

    if (!amount || !email || !bankCode || !accountNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Paystack configuration missing' },
        { status: 500 }
      );
    }

    // Create Paystack transfer recipient
    const recipientData = {
      type: 'nuban',
      name: accountName || 'Treasury Account',
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    };

    console.log('🚀 PAYSTACK DEPOSIT: Creating recipient:', recipientData);

    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recipientData)
    });

    const recipientResult = await recipientResponse.json();

    if (!recipientResult.status) {
      throw new Error(recipientResult.message || 'Failed to create recipient');
    }

    const recipientCode = recipientResult.data.recipient_code;
    console.log('🚀 PAYSTACK DEPOSIT: Recipient created:', recipientCode);

    // Create Paystack transfer
    const transferData = {
      source: 'balance',
      amount: amount * 100, // Convert to kobo
      recipient: recipientCode,
      reason: description
    };

    console.log('🚀 PAYSTACK DEPOSIT: Creating transfer:', transferData);

    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transferData)
    });

    const transferResult = await transferResponse.json();

    if (!transferResult.status) {
      throw new Error(transferResult.message || 'Failed to create transfer');
    }

    const transferCode = transferResult.data.transfer_code;
    console.log('🚀 PAYSTACK DEPOSIT: Transfer created:', transferCode);

    // Store transaction record in Firebase (only if Firebase is available)
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      const transactionRecord = {
        id: transferCode,
        type: 'NAIRA_DEPOSIT',
        currency: 'NAIRA',
        amount: amount,
        description: description,
        status: 'PENDING',
        email: email,
        bankCode: bankCode,
        accountNumber: accountNumber,
        accountName: accountName,
        paystackReference: transferCode,
        recipientCode: recipientCode,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await adminDb.collection('treasury_transactions').doc(transferCode).set(transactionRecord);
    } catch (firebaseError) {
      console.log('Firebase not available, skipping transaction record storage');
    }

    console.log('✅ PAYSTACK DEPOSIT: Successfully processed Naira deposit');

    return NextResponse.json({
      success: true,
      transferCode: transferCode,
      recipientCode: recipientCode,
      message: `Successfully initiated ₦${amount} deposit to treasury`
    });

  } catch (error: any) {
    console.error('❌ PAYSTACK DEPOSIT: Error processing deposit:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process Naira deposit' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // During build time, return success to avoid Firebase issues
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build-time response - Paystack status service not available',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🚀 PAYSTACK STATUS: Checking transfer status');

    const { searchParams } = new URL(request.url);
    const transferCode = searchParams.get('transferCode');

    if (!transferCode) {
      return NextResponse.json(
        { success: false, error: 'Transfer code required' },
        { status: 400 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Paystack configuration missing' },
        { status: 500 }
      );
    }

    // Check transfer status with Paystack
    const response = await fetch(`https://api.paystack.co/transfer/${transferCode}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const result = await response.json();

    if (!result.status) {
      throw new Error(result.message || 'Failed to check transfer status');
    }

    // Update Firebase record (only if Firebase is available)
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      await adminDb.collection('treasury_transactions').doc(transferCode).update({
        status: result.data.status.toUpperCase(),
        updatedAt: new Date()
      });
    } catch (firebaseError) {
      console.log('Firebase not available, skipping status update');
    }

    console.log('✅ PAYSTACK STATUS: Transfer status checked:', result.data.status);

    return NextResponse.json({
      success: true,
      status: result.data.status,
      amount: result.data.amount / 100, // Convert from kobo
      recipient: result.data.recipient,
      createdAt: result.data.createdAt
    });

  } catch (error: any) {
    console.error('❌ PAYSTACK STATUS: Error checking status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check transfer status' 
      },
      { status: 500 }
    );
  }
}
