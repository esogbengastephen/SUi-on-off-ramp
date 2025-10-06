import { doc, setDoc, getDoc, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WalletBalances } from '@/utils/suiWalletValidation';

export interface UserWalletRecord {
  id: string;
  userAddress: string;
  balances: WalletBalances;
  lastChecked: Date;
  gasFeeHistory: {
    transactionType: string;
    gasFee: number;
    timestamp: Date;
  }[];
  validationHistory: {
    tokenType: string;
    amount: number;
    canProceed: boolean;
    errorMessage?: string;
    timestamp: Date;
  }[];
}

export interface WalletValidationLog {
  id: string;
  userAddress: string;
  tokenType: 'SUI' | 'USDC' | 'USDT';
  amount: number;
  canProceed: boolean;
  errorMessage?: string;
  balances: WalletBalances;
  required: {
    swapToken: number;
    gasFee: number;
  };
  timestamp: Date;
}

/**
 * Save user wallet balances to Firebase
 */
export async function saveUserWalletBalances(
  userAddress: string,
  balances: WalletBalances
): Promise<void> {
  try {
    const walletRef = doc(db, 'userWallets', userAddress);
    
    await setDoc(walletRef, {
      userAddress,
      balances,
      lastChecked: new Date(),
      gasFeeHistory: [],
      validationHistory: []
    }, { merge: true });
    
    console.log('Wallet balances saved to Firebase');
  } catch (error) {
    console.error('Error saving wallet balances:', error);
    throw error;
  }
}

/**
 * Log wallet validation result to Firebase
 */
export async function logWalletValidation(
  userAddress: string,
  tokenType: 'SUI' | 'USDC' | 'USDT',
  amount: number,
  canProceed: boolean,
  errorMessage: string | undefined,
  balances: WalletBalances,
  required: { swapToken: number; gasFee: number }
): Promise<void> {
  try {
    const validationLog: Omit<WalletValidationLog, 'id'> = {
      userAddress,
      tokenType,
      amount,
      canProceed,
      errorMessage,
      balances,
      required,
      timestamp: new Date()
    };

    // Add to validation logs collection
    await addDoc(collection(db, 'walletValidationLogs'), validationLog);

    // Update user wallet record
    const walletRef = doc(db, 'userWallets', userAddress);
    const walletDoc = await getDoc(walletRef);
    
    if (walletDoc.exists()) {
      const walletData = walletDoc.data() as UserWalletRecord;
      const updatedValidationHistory = [
        ...walletData.validationHistory,
        {
          tokenType,
          amount,
          canProceed,
          errorMessage,
          timestamp: new Date()
        }
      ].slice(-50); // Keep only last 50 validations

      await setDoc(walletRef, {
        validationHistory: updatedValidationHistory,
        lastChecked: new Date()
      }, { merge: true });
    }

    console.log('Wallet validation logged to Firebase');
  } catch (error) {
    console.error('Error logging wallet validation:', error);
    throw error;
  }
}

/**
 * Log gas fee usage to Firebase
 */
export async function logGasFeeUsage(
  userAddress: string,
  transactionType: string,
  gasFee: number
): Promise<void> {
  try {
    const walletRef = doc(db, 'userWallets', userAddress);
    const walletDoc = await getDoc(walletRef);
    
    if (walletDoc.exists()) {
      const walletData = walletDoc.data() as UserWalletRecord;
      const updatedGasFeeHistory = [
        ...walletData.gasFeeHistory,
        {
          transactionType,
          gasFee,
          timestamp: new Date()
        }
      ].slice(-100); // Keep only last 100 gas fee records

      await setDoc(walletRef, {
        gasFeeHistory: updatedGasFeeHistory
      }, { merge: true });
    }

    console.log('Gas fee usage logged to Firebase');
  } catch (error) {
    console.error('Error logging gas fee usage:', error);
    throw error;
  }
}

/**
 * Get user wallet record from Firebase
 */
export async function getUserWalletRecord(userAddress: string): Promise<UserWalletRecord | null> {
  try {
    const walletRef = doc(db, 'userWallets', userAddress);
    const walletDoc = await getDoc(walletRef);
    
    if (walletDoc.exists()) {
      return walletDoc.data() as UserWalletRecord;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user wallet record:', error);
    return null;
  }
}

/**
 * Get wallet validation history from Firebase
 */
export async function getWalletValidationHistory(
  userAddress: string,
  limit: number = 20
): Promise<WalletValidationLog[]> {
  try {
    // This would require a query to get recent validation logs
    // For now, we'll get from the user wallet record
    const walletRecord = await getUserWalletRecord(userAddress);
    
    if (walletRecord) {
      return walletRecord.validationHistory.map(validation => ({
        id: `${userAddress}-${validation.timestamp.getTime()}`,
        userAddress,
        tokenType: validation.tokenType as 'SUI' | 'USDC' | 'USDT',
        amount: validation.amount,
        canProceed: validation.canProceed,
        errorMessage: validation.errorMessage,
        balances: walletRecord.balances,
        required: { swapToken: validation.amount, gasFee: 0.015 }, // Default gas fee
        timestamp: validation.timestamp
      })).slice(-limit);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting wallet validation history:', error);
    return [];
  }
}

/**
 * Real-time wallet monitoring hook
 */
export function useRealtimeWalletMonitoring(userAddress: string) {
  const [walletRecord, setWalletRecord] = useState<UserWalletRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    const walletRef = doc(db, 'userWallets', userAddress);
    
    const unsubscribe = onSnapshot(walletRef, (doc) => {
      if (doc.exists()) {
        setWalletRecord(doc.data() as UserWalletRecord);
      } else {
        setWalletRecord(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userAddress]);

  return {
    walletRecord,
    isLoading
  };
}

/**
 * Get wallet statistics for admin dashboard
 */
export async function getWalletStatistics(): Promise<{
  totalUsers: number;
  totalValidations: number;
  successRate: number;
  averageGasFee: number;
  topTokenTypes: { tokenType: string; count: number }[];
}> {
  try {
    // This would require more complex queries
    // For now, return mock data structure
    return {
      totalUsers: 0,
      totalValidations: 0,
      successRate: 0,
      averageGasFee: 0.015,
      topTokenTypes: []
    };
  } catch (error) {
    console.error('Error getting wallet statistics:', error);
    return {
      totalUsers: 0,
      totalValidations: 0,
      successRate: 0,
      averageGasFee: 0.015,
      topTokenTypes: []
    };
  }
}
