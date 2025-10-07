import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TRANSACTION STATS: Fetching transaction statistics');
    
    // Get all transactions from Firebase
    const transactionsSnapshot = await adminDb.collection('transactions').get();
    
    let totalTransactions = 0;
    let pendingTransactions = 0;
    let completedTransactions = 0;
    let failedTransactions = 0;
    let dailyVolume = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    transactionsSnapshot.forEach((doc) => {
      const transactionData = doc.data();
      totalTransactions++;
      
      switch (transactionData.status) {
        case 'PENDING':
          pendingTransactions++;
          break;
        case 'COMPLETED':
          completedTransactions++;
          break;
        case 'FAILED':
          failedTransactions++;
          break;
      }
      
      // Calculate daily volume for today
      const transactionDate = transactionData.createdAt?.toDate();
      if (transactionDate && transactionDate >= today) {
        dailyVolume += transactionData.nairaAmount || 0;
      }
    });
    
    const stats = {
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      failedTransactions,
      dailyVolume,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('✅ TRANSACTION STATS: Successfully fetched transaction statistics:', stats);
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error: any) {
    console.error('❌ TRANSACTION STATS: Error fetching transaction statistics:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch transaction statistics'
    }, { status: 500 });
  }
}
