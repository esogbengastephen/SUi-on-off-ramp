import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { collection, getDocs, orderBy, query, limit } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TREASURY BALANCE API: Fetching treasury balances');

    // For now, we'll return mock data since we don't have real treasury balance tracking yet
    // In a real implementation, this would query the actual blockchain balances
    
    const mockBalances = [
      {
        currency: 'SUI',
        balance: 1000.0,
        availableBalance: 950.0,
        lockedBalance: 50.0,
        lastUpdated: new Date()
      },
      {
        currency: 'USDC',
        balance: 5000.0,
        availableBalance: 4800.0,
        lockedBalance: 200.0,
        lastUpdated: new Date()
      },
      {
        currency: 'USDT',
        balance: 3000.0,
        availableBalance: 2850.0,
        lockedBalance: 150.0,
        lastUpdated: new Date()
      }
    ];

    console.log('🚀 TREASURY BALANCE API: Returning mock balances:', mockBalances);

    return NextResponse.json({
      success: true,
      balances: mockBalances,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ TREASURY BALANCE API: Error fetching balances:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch treasury balances' 
      },
      { status: 500 }
    );
  }
}

// Helper function to check if treasury has sufficient balance for a specific token
export async function checkTreasuryBalance(tokenType: string, requiredAmount: number): Promise<boolean> {
  try {
    console.log('🚀 TREASURY CHECK: Checking balance for', tokenType, 'Required:', requiredAmount);

    // For now, we'll use mock data
    // In a real implementation, this would query the actual blockchain balance
    
    const mockBalances: { [key: string]: number } = {
      'SUI': 950.0,
      'USDC': 4800.0,
      'USDT': 2850.0
    };

    const availableBalance = mockBalances[tokenType] || 0;
    const hasSufficientBalance = availableBalance >= requiredAmount;

    console.log('🚀 TREASURY CHECK: Available balance:', availableBalance, 'Has sufficient:', hasSufficientBalance);

    return hasSufficientBalance;

  } catch (error) {
    console.error('❌ TREASURY CHECK: Error checking balance:', error);
    return false;
  }
}

// Helper function to get treasury balance details for a specific token
export async function getTreasuryBalanceDetails(tokenType: string) {
  try {
    console.log('🚀 TREASURY DETAILS: Getting details for', tokenType);

    // For now, we'll use mock data
    const mockBalances: { [key: string]: any } = {
      'SUI': {
        currency: 'SUI',
        balance: 1000.0,
        availableBalance: 950.0,
        lockedBalance: 50.0,
        lastUpdated: new Date()
      },
      'USDC': {
        currency: 'USDC',
        balance: 5000.0,
        availableBalance: 4800.0,
        lockedBalance: 200.0,
        lastUpdated: new Date()
      },
      'USDT': {
        currency: 'USDT',
        balance: 3000.0,
        availableBalance: 2850.0,
        lockedBalance: 150.0,
        lastUpdated: new Date()
      }
    };

    return mockBalances[tokenType] || null;

  } catch (error) {
    console.error('❌ TREASURY DETAILS: Error getting details:', error);
    return null;
  }
}
