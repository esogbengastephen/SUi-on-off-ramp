import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

export interface TreasuryBalance {
  currency: 'SUI' | 'USDC' | 'USDT' | 'NAIRA';
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  walletAddress?: string;
  contractAddress?: string;
  lastUpdated: Date;
}

export interface TreasuryTransaction {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'SWAP_IN' | 'SWAP_OUT' | 'FEE_COLLECTION';
  currency: 'SUI' | 'USDC' | 'USDT' | 'NAIRA';
  amount: number;
  transactionHash?: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

// Sample treasury balances
const sampleBalances: Omit<TreasuryBalance, 'lastUpdated'>[] = [
  {
    currency: 'SUI',
    balance: 1250.75,
    availableBalance: 1200.00,
    lockedBalance: 50.75,
    walletAddress: process.env.NEXT_PUBLIC_TREASURY_ID || '0x3d14b2c3f871b3a577ec777337f2ab6d465b82cd833987461e7e1210670b7595',
    contractAddress: process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || '0xb5a494a7253e5030ba0ab012f268eedccfd9338f4ed1698c2a6b28324cc1f2c9'
  },
  {
    currency: 'USDC',
    balance: 50000.00,
    availableBalance: 48000.00,
    lockedBalance: 2000.00,
    walletAddress: process.env.NEXT_PUBLIC_TREASURY_ID || '0x3d14b2c3f871b3a577ec777337f2ab6d465b82cd833987461e7e1210670b7595'
  },
  {
    currency: 'USDT',
    balance: 25000.00,
    availableBalance: 24000.00,
    lockedBalance: 1000.00,
    walletAddress: process.env.NEXT_PUBLIC_TREASURY_ID || '0x3d14b2c3f871b3a577ec777337f2ab6d465b82cd833987461e7e1210670b7595'
  },
  {
    currency: 'NAIRA',
    balance: 75000000.00,
    availableBalance: 70000000.00,
    lockedBalance: 5000000.00
  }
];

// Sample treasury transactions
const sampleTransactions: Omit<TreasuryTransaction, 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'DEPOSIT',
    currency: 'SUI',
    amount: 1000,
    status: 'COMPLETED',
    description: 'Initial treasury deposit',
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  },
  {
    type: 'SWAP_IN',
    currency: 'USDC',
    amount: 5000,
    status: 'COMPLETED',
    description: 'Swap transaction completed',
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  },
  {
    type: 'FEE_COLLECTION',
    currency: 'NAIRA',
    amount: 50000,
    status: 'COMPLETED',
    description: 'Transaction fee collected'
  },
  {
    type: 'WITHDRAWAL',
    currency: 'USDT',
    amount: 2000,
    status: 'PENDING',
    description: 'Pending withdrawal request'
  },
  {
    type: 'SWAP_OUT',
    currency: 'SUI',
    amount: 500,
    status: 'COMPLETED',
    description: 'User swap completed',
    transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba'
  },
  {
    type: 'DEPOSIT',
    currency: 'USDC',
    amount: 10000,
    status: 'COMPLETED',
    description: 'Large deposit received',
    transactionHash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'
  },
  {
    type: 'FEE_COLLECTION',
    currency: 'USDT',
    amount: 150,
    status: 'COMPLETED',
    description: 'Swap fee collected'
  },
  {
    type: 'WITHDRAWAL',
    currency: 'NAIRA',
    amount: 1000000,
    status: 'COMPLETED',
    description: 'Naira withdrawal processed',
    transactionHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff'
  }
];

export async function seedTreasuryBalances(): Promise<void> {
  try {
    console.log('Seeding treasury balances...');
    
    for (const balance of sampleBalances) {
      await addDoc(collection(db, COLLECTIONS.TREASURY_BALANCES), {
        ...balance,
        lastUpdated: serverTimestamp()
      });
    }
    
    console.log('✅ Treasury balances seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding treasury balances:', error);
    throw error;
  }
}

export async function seedTreasuryTransactions(): Promise<void> {
  try {
    console.log('Seeding treasury transactions...');
    
    for (const transaction of sampleTransactions) {
      await addDoc(collection(db, COLLECTIONS.TREASURY_TRANSACTIONS), {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('✅ Treasury transactions seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding treasury transactions:', error);
    throw error;
  }
}

export async function seedAllTreasuryData(): Promise<void> {
  try {
    console.log('🌱 Starting Firebase data seeding...');
    
    await seedTreasuryBalances();
    await seedTreasuryTransactions();
    
    console.log('🎉 All treasury data seeded successfully!');
  } catch (error) {
    console.error('💥 Error seeding treasury data:', error);
    throw error;
  }
}

// Function to check if data already exists
export async function checkExistingData(): Promise<{ balances: number; transactions: number }> {
  try {
    const { getDocs } = await import('firebase/firestore');
    
    const balancesSnapshot = await getDocs(collection(db, COLLECTIONS.TREASURY_BALANCES));
    const transactionsSnapshot = await getDocs(collection(db, COLLECTIONS.TREASURY_TRANSACTIONS));
    
    return {
      balances: balancesSnapshot.size,
      transactions: transactionsSnapshot.size
    };
  } catch (error) {
    console.error('Error checking existing data:', error);
    return { balances: 0, transactions: 0 };
  }
}
