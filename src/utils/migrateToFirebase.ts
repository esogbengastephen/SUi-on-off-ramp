import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

export interface LocalStorageTransaction {
  id: string;
  txId: string;
  type: 'ON_RAMP' | 'OFF_RAMP';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'FAILED';
  userAddress: string;
  suiAmount: number;
  nairaAmount: number;
  exchangeRate: number;
  paymentReference?: string;
  bankAccount?: string;
  bankName?: string;
  paymentSourceAccount?: string;
  paymentSourceName?: string;
  transferStatus?: string;
  verificationData?: any;
  createdAt: string;
  updatedAt: string;
}

export async function migrateLocalStorageToFirebase(): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    // Get existing transactions from localStorage
    const localTransactionsJson = localStorage.getItem('swapTransactions');
    if (!localTransactionsJson) {
      return { success: true, migratedCount: 0, errors: [] };
    }

    const localTransactions: LocalStorageTransaction[] = JSON.parse(localTransactionsJson);
    
    if (localTransactions.length === 0) {
      return { success: true, migratedCount: 0, errors: [] };
    }

    // Check if Firebase already has transactions
    const existingTransactions = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    if (existingTransactions.docs.length > 0) {
      console.log('Firebase already has transactions, skipping migration');
      return { success: true, migratedCount: 0, errors: ['Firebase already contains transactions'] };
    }

    // Migrate each transaction to Firebase
    for (const transaction of localTransactions) {
      try {
        await addDoc(collection(db, COLLECTIONS.TRANSACTIONS), {
          txId: transaction.txId,
          type: transaction.type,
          status: transaction.status,
          userAddress: transaction.userAddress,
          suiAmount: transaction.suiAmount,
          nairaAmount: transaction.nairaAmount,
          exchangeRate: transaction.exchangeRate,
          paymentReference: transaction.paymentReference,
          bankAccount: transaction.bankAccount,
          bankName: transaction.bankName,
          paymentSourceAccount: transaction.paymentSourceAccount,
          paymentSourceName: transaction.paymentSourceName,
          transferStatus: transaction.transferStatus,
          verificationData: transaction.verificationData,
          createdAt: new Date(transaction.createdAt),
          updatedAt: new Date(transaction.updatedAt),
          migratedAt: new Date(),
          source: 'localStorage'
        });
        
        migratedCount++;
      } catch (error) {
        const errorMessage = `Failed to migrate transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error('Migration error for transaction:', transaction.id, error);
      }
    }

    // Clear localStorage after successful migration
    if (errors.length === 0) {
      localStorage.removeItem('swapTransactions');
      console.log(`Successfully migrated ${migratedCount} transactions to Firebase`);
    } else {
      console.log(`Migrated ${migratedCount} transactions with ${errors.length} errors`);
    }

    return { 
      success: errors.length === 0, 
      migratedCount, 
      errors 
    };

  } catch (error) {
    const errorMessage = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMessage);
    console.error('Migration failed:', error);
    
    return { 
      success: false, 
      migratedCount, 
      errors 
    };
  }
}

export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    return true;
  } catch (error) {
    console.error('Firebase connection check failed:', error);
    return false;
  }
}

export function getLocalStorageTransactionCount(): number {
  try {
    const localTransactionsJson = localStorage.getItem('swapTransactions');
    if (!localTransactionsJson) return 0;
    
    const localTransactions: LocalStorageTransaction[] = JSON.parse(localTransactionsJson);
    return localTransactions.length;
  } catch (error) {
    console.error('Error reading localStorage transactions:', error);
    return 0;
  }
}
