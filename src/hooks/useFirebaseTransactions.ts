import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc,
  where,
  limit
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

export interface FirebaseTransaction {
  id?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export function useFirebaseTransactions() {
  const [transactions, setTransactions] = useState<FirebaseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as FirebaseTransaction[];
        
        setTransactions(transactionsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Firebase transactions error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addTransaction = async (transaction: Omit<FirebaseTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTIONS.TRANSACTIONS), {
        ...transaction,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<FirebaseTransaction>) => {
    try {
      const docRef = doc(db, COLLECTIONS.TRANSACTIONS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const getTransactionsByUser = (userAddress: string) => {
    return transactions.filter(tx => tx.userAddress === userAddress);
  };

  const getTransactionsByStatus = (status: FirebaseTransaction['status']) => {
    return transactions.filter(tx => tx.status === status);
  };

  return { 
    transactions, 
    loading, 
    error, 
    addTransaction, 
    updateTransaction,
    getTransactionsByUser,
    getTransactionsByStatus
  };
}

export function useFirebaseTransactionById(id: string) {
  const [transaction, setTransaction] = useState<FirebaseTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where('__name__', '==', id),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (snapshot.docs.length > 0) {
          const doc = snapshot.docs[0];
          setTransaction({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          } as FirebaseTransaction);
        } else {
          setTransaction(null);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Firebase transaction by ID error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  return { transaction, loading, error };
}
