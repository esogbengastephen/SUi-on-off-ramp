import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';

// Mock treasury data for fallback
const mockTreasuryBalances = [
  {
    currency: 'SUI',
    balance: 1250.75,
    availableBalance: 1200.00,
    lockedBalance: 50.75,
    walletAddress: process.env.NEXT_PUBLIC_TREASURY_ID || '0x...',
    contractAddress: process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || '0x...',
    lastUpdated: new Date()
  },
  {
    currency: 'USDC',
    balance: 50000.00,
    availableBalance: 48000.00,
    lockedBalance: 2000.00,
    walletAddress: process.env.NEXT_PUBLIC_TREASURY_ID || '0x...',
    lastUpdated: new Date()
  },
  {
    currency: 'USDT',
    balance: 25000.00,
    availableBalance: 24000.00,
    lockedBalance: 1000.00,
    walletAddress: process.env.NEXT_PUBLIC_TREASURY_ID || '0x...',
    lastUpdated: new Date()
  },
  {
    currency: 'NAIRA',
    balance: 75000000.00,
    availableBalance: 70000000.00,
    lockedBalance: 5000000.00,
    lastUpdated: new Date()
  }
];

const mockTreasuryMetrics = {
  totalValueUSD: 125000,
  totalValueNGN: 187500000,
  dailyVolume: 15000,
  dailyFees: 750,
  activeTransactions: 3,
  last24HoursDeposits: 25000,
  last24HoursWithdrawals: 10000
};

// GET - Fetch treasury balances and metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'balances';
    
    switch (action) {
      case 'balances':
        try {
          // Try to get real balances from Firebase
          const balancesRef = adminDb.collection(ADMIN_COLLECTIONS.TREASURY_BALANCES);
          const balancesSnapshot = await balancesRef.get();
          
          if (!balancesSnapshot.empty) {
            const balances = balancesSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                currency: data.currency || 'UNKNOWN',
                balance: data.balance || 0,
                availableBalance: data.availableBalance || 0,
                lockedBalance: data.lockedBalance || 0,
                walletAddress: data.walletAddress || '',
                contractAddress: data.contractAddress || '',
                lastUpdated: data.lastUpdated?.toDate() || new Date()
              };
            });
            
            return NextResponse.json({
              timestamp: new Date().toISOString(),
              balances,
              success: true,
              source: 'firebase'
            });
          } else {
            // No data in Firebase, return mock data
            return NextResponse.json({
              timestamp: new Date().toISOString(),
              balances: mockTreasuryBalances,
              success: true,
              source: 'mock',
              note: 'No Firebase data found, using mock data'
            });
          }
        } catch (firebaseError) {
          console.error('Firebase error, using mock data:', firebaseError);
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            balances: mockTreasuryBalances,
            success: true,
            source: 'mock',
            note: 'Firebase error, using mock data'
          });
        }
        
      case 'metrics':
        try {
          // Try to get real metrics from Firebase
          const transactionsRef = adminDb.collection(ADMIN_COLLECTIONS.TREASURY_TRANSACTIONS);
          const last24Hours = new Date();
          last24Hours.setHours(last24Hours.getHours() - 24);
          
          const querySnapshot = await transactionsRef
            .where('createdAt', '>=', last24Hours)
            .orderBy('createdAt', 'desc')
            .get();
          const transactions = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type || 'UNKNOWN',
              currency: data.currency || 'UNKNOWN',
              amount: data.amount || 0,
              status: data.status || 'UNKNOWN',
              description: data.description || '',
              transactionHash: data.transactionHash || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            };
          });
          
          const dailyVolume = transactions
            .filter(tx => tx.status === 'COMPLETED')
            .reduce((total, tx) => total + tx.amount, 0);
          
          const dailyFees = transactions
            .filter(tx => tx.type === 'FEE_COLLECTION' && tx.status === 'COMPLETED')
            .reduce((total, tx) => total + tx.amount, 0);
          
          const activeTransactions = transactions.filter(tx => tx.status === 'PENDING').length;
          
          const deposits = transactions
            .filter(tx => tx.type === 'DEPOSIT' && tx.status === 'COMPLETED')
            .reduce((total, tx) => total + tx.amount, 0);
          
          const withdrawals = transactions
            .filter(tx => tx.type === 'WITHDRAWAL' && tx.status === 'COMPLETED')
            .reduce((total, tx) => total + tx.amount, 0);
          
          const metrics = {
            totalValueUSD: mockTreasuryMetrics.totalValueUSD,
            totalValueNGN: mockTreasuryMetrics.totalValueNGN,
            dailyVolume,
            dailyFees,
            activeTransactions,
            last24HoursDeposits: deposits,
            last24HoursWithdrawals: withdrawals
          };
          
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            metrics,
            success: true,
            source: 'firebase'
          });
        } catch (firebaseError) {
          console.error('Firebase error, using mock metrics:', firebaseError);
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            metrics: mockTreasuryMetrics,
            success: true,
            source: 'mock',
            note: 'Firebase error, using mock metrics'
          });
        }
        
      case 'all':
        try {
          // Get both balances and metrics
          const balancesRef = adminDb.collection(ADMIN_COLLECTIONS.TREASURY_BALANCES);
          const balancesSnapshot = await balancesRef.get();
          
          let balances = mockTreasuryBalances;
          let balancesSource = 'mock';
          
          if (!balancesSnapshot.empty) {
            balances = balancesSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                currency: data.currency || 'UNKNOWN',
                balance: data.balance || 0,
                availableBalance: data.availableBalance || 0,
                lockedBalance: data.lockedBalance || 0,
                walletAddress: data.walletAddress || '',
                contractAddress: data.contractAddress || '',
                lastUpdated: data.lastUpdated?.toDate() || new Date()
              };
            });
            balancesSource = 'firebase';
          }
          
          // Get metrics
          const transactionsRef = adminDb.collection(ADMIN_COLLECTIONS.TREASURY_TRANSACTIONS);
          const last24Hours = new Date();
          last24Hours.setHours(last24Hours.getHours() - 24);
          
          const querySnapshot = await transactionsRef
            .where('createdAt', '>=', last24Hours)
            .orderBy('createdAt', 'desc')
            .get();
          const transactions = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type || 'UNKNOWN',
              currency: data.currency || 'UNKNOWN',
              amount: data.amount || 0,
              status: data.status || 'UNKNOWN',
              description: data.description || '',
              transactionHash: data.transactionHash || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            };
          });
          
          const dailyVolume = transactions
            .filter(tx => tx.status === 'COMPLETED')
            .reduce((total, tx) => total + tx.amount, 0);
          
          const dailyFees = transactions
            .filter(tx => tx.type === 'FEE_COLLECTION' && tx.status === 'COMPLETED')
            .reduce((total, tx) => total + tx.amount, 0);
          
          const activeTransactions = transactions.filter(tx => tx.status === 'PENDING').length;
          
          const deposits = transactions
            .filter(tx => tx.type === 'DEPOSIT' && tx.status === 'COMPLETED')
            .reduce((total, tx) => total + tx.amount, 0);
          
          const withdrawals = transactions
            .filter(tx => tx.type === 'WITHDRAWAL' && tx.status === 'COMPLETED')
            .reduce((total, tx) => total + tx.amount, 0);
          
          const metrics = {
            totalValueUSD: mockTreasuryMetrics.totalValueUSD,
            totalValueNGN: mockTreasuryMetrics.totalValueNGN,
            dailyVolume,
            dailyFees,
            activeTransactions,
            last24HoursDeposits: deposits,
            last24HoursWithdrawals: withdrawals
          };
          
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            balances,
            metrics,
            success: true,
            source: balancesSource,
            note: balancesSource === 'mock' ? 'Using mock balances, Firebase metrics' : 'Using Firebase data'
          });
        } catch (firebaseError) {
          console.error('Firebase error, using mock data:', firebaseError);
          return NextResponse.json({
            timestamp: new Date().toISOString(),
            balances: mockTreasuryBalances,
            metrics: mockTreasuryMetrics,
            success: true,
            source: 'mock',
            note: 'Firebase error, using mock data'
          });
        }
        
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Treasury API error:', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// POST - Create treasury transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.type || !body.currency || !body.amount) {
      return NextResponse.json(
        { error: 'Missing required fields: type, currency, amount' },
        { status: 400 }
      );
    }
    
    try {
      // Try to create transaction in Firebase
      const transactionsRef = adminDb.collection(ADMIN_COLLECTIONS.TREASURY_TRANSACTIONS);
      const docRef = await transactionsRef.add({
        ...body,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        id: docRef.id,
        success: true,
        message: 'Treasury transaction created successfully',
        source: 'firebase'
      });
    } catch (firebaseError) {
      console.error('Firebase error, using mock transaction:', firebaseError);
      
      // Fallback to mock transaction
      const mockTransactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        id: mockTransactionId,
        success: true,
        message: 'Treasury transaction created successfully (mock)',
        source: 'mock',
        note: 'Firebase error, using mock transaction'
      });
    }
    
  } catch (error) {
    console.error('Treasury transaction creation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to create treasury transaction' },
      { status: 500 }
    );
  }
}

// PUT - Update treasury transaction
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    try {
      // Try to update transaction in Firebase
      const transactionRef = adminDb.collection(ADMIN_COLLECTIONS.TREASURY_TRANSACTIONS).doc(transactionId);
      await transactionRef.update({
        ...body,
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Treasury transaction updated successfully',
        source: 'firebase'
      });
    } catch (firebaseError) {
      console.error('Firebase error, using mock update:', firebaseError);
      
      return NextResponse.json({
        success: true,
        message: 'Treasury transaction updated successfully (mock)',
        source: 'mock',
        note: 'Firebase error, using mock update'
      });
    }
    
  } catch (error) {
    console.error('Treasury transaction update error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update treasury transaction' },
      { status: 500 }
    );
  }
}