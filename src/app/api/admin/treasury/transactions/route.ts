import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { collection, addDoc, updateDoc, doc, query, orderBy, limit, getDocs, where } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TREASURY TRANSACTIONS API: Fetching treasury transactions');

    // For now, we'll return mock data since we don't have real treasury transaction tracking yet
    // In a real implementation, this would query the actual blockchain transactions
    
    const mockTransactions = [
      {
        id: 'tx_001',
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: 1000,
        currency: 'SUI',
        description: 'Initial treasury funding',
        transactionHash: '0x1234567890abcdef',
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: 'tx_002',
        type: 'SWAP_OUT',
        status: 'COMPLETED',
        amount: 50,
        currency: 'SUI',
        description: 'User ON-RAMP transaction',
        transactionHash: '0x2345678901bcdef0',
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        id: 'tx_003',
        type: 'FEE_COLLECTION',
        status: 'COMPLETED',
        amount: 0.5,
        currency: 'SUI',
        description: 'Transaction fee collection',
        transactionHash: '0x3456789012cdef01',
        createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
      },
      {
        id: 'tx_004',
        type: 'DEPOSIT',
        status: 'PENDING',
        amount: 500,
        currency: 'USDC',
        description: 'USDC treasury funding',
        createdAt: new Date(Date.now() - 900000) // 15 minutes ago
      }
    ];

    console.log('🚀 TREASURY TRANSACTIONS API: Returning mock transactions:', mockTransactions.length);

    return NextResponse.json({
      success: true,
      transactions: mockTransactions,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ TREASURY TRANSACTIONS API: Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch treasury transactions' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 TREASURY TRANSACTIONS API: Creating treasury transaction');
    
    const body = await request.json();
    const { type, amount, currency, description, transactionHash } = body;

    // Validate required parameters
    if (!type || !amount || !currency) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: type, amount, currency' 
        },
        { status: 400 }
      );
    }

    // Validate transaction type
    if (!['DEPOSIT', 'WITHDRAWAL', 'SWAP_IN', 'SWAP_OUT', 'FEE_COLLECTION'].includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid transaction type' 
        },
        { status: 400 }
      );
    }

    // Create transaction record in Firebase
    const transactionsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_TRANSACTIONS);
    const docRef = await addDoc(transactionsRef, {
      type,
      status: 'PENDING',
      amount: Number(amount),
      currency,
      description: description || '',
      transactionHash: transactionHash || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ TREASURY TRANSACTIONS API: Transaction created with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      transactionId: docRef.id,
      message: 'Treasury transaction created successfully'
    });

  } catch (error: any) {
    console.error('❌ TREASURY TRANSACTIONS API: Error creating transaction:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create treasury transaction' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 TREASURY TRANSACTIONS API: Updating treasury transaction');
    
    const body = await request.json();
    const { transactionId, status, transactionHash } = body;

    // Validate required parameters
    if (!transactionId || !status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: transactionId, status' 
        },
        { status: 400 }
      );
    }

    // Validate status
    if (!['COMPLETED', 'PENDING', 'FAILED'].includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid transaction status' 
        },
        { status: 400 }
      );
    }

    // Update transaction in Firebase
    const transactionRef = doc(adminDb, ADMIN_COLLECTIONS.TREASURY_TRANSACTIONS, transactionId);
    await updateDoc(transactionRef, {
      status,
      transactionHash: transactionHash || '',
      updatedAt: new Date()
    });

    console.log('✅ TREASURY TRANSACTIONS API: Transaction updated:', transactionId);

    return NextResponse.json({
      success: true,
      message: 'Treasury transaction updated successfully'
    });

  } catch (error: any) {
    console.error('❌ TREASURY TRANSACTIONS API: Error updating transaction:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update treasury transaction' 
      },
      { status: 500 }
    );
  }
}
