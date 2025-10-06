import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

export interface FirebaseAnalytics {
  totalTransactions: number;
  totalVolume: number;
  totalRevenue: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  onRampTransactions: number;
  offRampTransactions: number;
  averageTransactionValue: number;
  last24HoursTransactions: number;
  last24HoursVolume: number;
}

export function useFirebaseAnalytics() {
  const [analytics, setAnalytics] = useState<FirebaseAnalytics>({
    totalTransactions: 0,
    totalVolume: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    onRampTransactions: 0,
    offRampTransactions: 0,
    averageTransactionValue: 0,
    last24HoursTransactions: 0,
    last24HoursVolume: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.TRANSACTIONS));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const transactions = snapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const completedTransactions = transactions.filter(tx => tx.status === 'COMPLETED');
        const pendingTransactions = transactions.filter(tx => tx.status === 'PENDING');
        const failedTransactions = transactions.filter(tx => tx.status === 'FAILED');
        const onRampTransactions = transactions.filter(tx => tx.type === 'ON_RAMP');
        const offRampTransactions = transactions.filter(tx => tx.type === 'OFF_RAMP');
        
        const last24HoursTransactions = transactions.filter(tx => 
          tx.createdAt >= last24Hours
        );
        
        const totalVolume = transactions.reduce((sum, tx) => sum + (tx.nairaAmount || 0), 0);
        const totalRevenue = completedTransactions.reduce((sum, tx) => 
          sum + (tx.nairaAmount * 0.01), 0 // 1% fee
        );
        const last24HoursVolume = last24HoursTransactions.reduce((sum, tx) => 
          sum + (tx.nairaAmount || 0), 0
        );
        
        const averageTransactionValue = transactions.length > 0 
          ? totalVolume / transactions.length 
          : 0;

        const newAnalytics: FirebaseAnalytics = {
          totalTransactions: transactions.length,
          totalVolume,
          totalRevenue,
          pendingTransactions: pendingTransactions.length,
          completedTransactions: completedTransactions.length,
          failedTransactions: failedTransactions.length,
          onRampTransactions: onRampTransactions.length,
          offRampTransactions: offRampTransactions.length,
          averageTransactionValue,
          last24HoursTransactions: last24HoursTransactions.length,
          last24HoursVolume
        };

        setAnalytics(newAnalytics);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Firebase analytics error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase analytics listener error:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { analytics, loading, error };
}

export function useFirebaseAnalyticsByPeriod(days: number = 7) {
  const [analytics, setAnalytics] = useState<FirebaseAnalytics>({
    totalTransactions: 0,
    totalVolume: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    onRampTransactions: 0,
    offRampTransactions: 0,
    averageTransactionValue: 0,
    last24HoursTransactions: 0,
    last24HoursVolume: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.TRANSACTIONS));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const now = new Date();
        const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        const transactions = snapshot.docs
          .map(doc => ({
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }))
          .filter(tx => tx.createdAt >= periodStart);

        const completedTransactions = transactions.filter(tx => tx.status === 'COMPLETED');
        const pendingTransactions = transactions.filter(tx => tx.status === 'PENDING');
        const failedTransactions = transactions.filter(tx => tx.status === 'FAILED');
        const onRampTransactions = transactions.filter(tx => tx.type === 'ON_RAMP');
        const offRampTransactions = transactions.filter(tx => tx.type === 'OFF_RAMP');
        
        const totalVolume = transactions.reduce((sum, tx) => sum + (tx.nairaAmount || 0), 0);
        const totalRevenue = completedTransactions.reduce((sum, tx) => 
          sum + (tx.nairaAmount * 0.01), 0 // 1% fee
        );
        
        const averageTransactionValue = transactions.length > 0 
          ? totalVolume / transactions.length 
          : 0;

        const newAnalytics: FirebaseAnalytics = {
          totalTransactions: transactions.length,
          totalVolume,
          totalRevenue,
          pendingTransactions: pendingTransactions.length,
          completedTransactions: completedTransactions.length,
          failedTransactions: failedTransactions.length,
          onRampTransactions: onRampTransactions.length,
          offRampTransactions: offRampTransactions.length,
          averageTransactionValue,
          last24HoursTransactions: 0, // Not applicable for period analytics
          last24HoursVolume: 0 // Not applicable for period analytics
        };

        setAnalytics(newAnalytics);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Firebase period analytics error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase period analytics listener error:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [days]);

  return { analytics, loading, error };
}
