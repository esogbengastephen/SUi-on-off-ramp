import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TREASURY METRICS API: Fetching treasury metrics');

    // For now, we'll return mock data since we don't have real treasury metrics calculation yet
    // In a real implementation, this would calculate metrics from actual transaction data
    
    const mockMetrics = {
      totalValueUSD: 15000,
      totalValueNGN: 22500000, // Assuming 1 USD = 1500 NGN
      dailyVolume: 2500,
      dailyFees: 25,
      activeTransactions: 3
    };

    console.log('🚀 TREASURY METRICS API: Returning mock metrics:', mockMetrics);

    return NextResponse.json({
      success: true,
      metrics: mockMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ TREASURY METRICS API: Error fetching metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch treasury metrics' 
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate real metrics from transaction data
async function calculateRealMetrics() {
  try {
    console.log('🚀 TREASURY METRICS: Calculating real metrics from transaction data');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get today's transactions
    const transactionsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_TRANSACTIONS);
    const todayQuery = query(
      transactionsRef,
      where('createdAt', '>=', startOfDay),
      where('status', '==', 'COMPLETED')
    );
    
    const todaySnapshot = await getDocs(todayQuery);
    const todayTransactions = todaySnapshot.docs.map(doc => doc.data());

    // Calculate daily volume
    const dailyVolume = todayTransactions.reduce((sum, tx) => {
      if (tx.type === 'SWAP_OUT' || tx.type === 'DEPOSIT') {
        return sum + tx.amount;
      }
      return sum;
    }, 0);

    // Calculate daily fees
    const dailyFees = todayTransactions.reduce((sum, tx) => {
      if (tx.type === 'FEE_COLLECTION') {
        return sum + tx.amount;
      }
      return sum;
    }, 0);

    // Get active transactions (pending)
    const pendingQuery = query(
      transactionsRef,
      where('status', '==', 'PENDING')
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);
    const activeTransactions = pendingSnapshot.size;

    // Get current balances (this would need to be calculated from actual blockchain data)
    const balancesRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_BALANCES);
    const balancesSnapshot = await getDocs(balancesRef);
    const balances = balancesSnapshot.docs.map(doc => doc.data());

    // Calculate total value in USD (simplified calculation)
    const totalValueUSD = balances.reduce((sum, balance) => {
      // This would need real-time price data
      const usdRates = { 'SUI': 0.5, 'USDC': 1, 'USDT': 1, 'NAIRA': 0.00067 };
      return sum + (balance.availableBalance * (usdRates[balance.currency] || 0));
    }, 0);

    const totalValueNGN = totalValueUSD * 1500; // Assuming 1 USD = 1500 NGN

    const metrics = {
      totalValueUSD: Math.round(totalValueUSD * 100) / 100,
      totalValueNGN: Math.round(totalValueNGN),
      dailyVolume: Math.round(dailyVolume * 100) / 100,
      dailyFees: Math.round(dailyFees * 100) / 100,
      activeTransactions
    };

    console.log('✅ TREASURY METRICS: Calculated real metrics:', metrics);

    return metrics;

  } catch (error) {
    console.error('❌ TREASURY METRICS: Error calculating real metrics:', error);
    
    // Return mock data as fallback
    return {
      totalValueUSD: 15000,
      totalValueNGN: 22500000,
      dailyVolume: 2500,
      dailyFees: 25,
      activeTransactions: 3
    };
  }
}
