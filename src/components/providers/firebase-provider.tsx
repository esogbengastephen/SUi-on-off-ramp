"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { migrateLocalStorageToFirebase, checkFirebaseConnection } from '@/utils/migrateToFirebase';

interface FirebaseContextType {
  isConnected: boolean;
  migrationStatus: 'idle' | 'migrating' | 'completed' | 'error';
  migrationError: string | null;
  migratedCount: number;
}

const FirebaseContext = createContext<FirebaseContextType>({
  isConnected: false,
  migrationStatus: 'idle',
  migrationError: null,
  migratedCount: 0
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migratedCount, setMigratedCount] = useState(0);

  const { user, loading: authLoading } = useFirebaseAuth();

  useEffect(() => {
    // Skip Firebase initialization during build time
    if (process.env.BUILD_TIME === 'true' || process.env.NETLIFY === 'true') {
      setMigrationStatus('completed');
      return;
    }

    const initializeFirebase = async () => {
      try {
        // Check Firebase connection
        const connected = await checkFirebaseConnection();
        setIsConnected(connected);

        if (connected) {
          // Check if we need to migrate data
          const localCount = localStorage.getItem('swapTransactions') ? 
            JSON.parse(localStorage.getItem('swapTransactions') || '[]').length : 0;
          
          if (localCount > 0) {
            setMigrationStatus('migrating');
            
            const result = await migrateLocalStorageToFirebase();
            
            if (result.success) {
              setMigrationStatus('completed');
              setMigratedCount(result.migratedCount);
            } else {
              setMigrationStatus('error');
              setMigrationError(result.errors.join(', '));
            }
          } else {
            setMigrationStatus('completed');
          }
        }
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setIsConnected(false);
        setMigrationStatus('error');
        setMigrationError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeFirebase();
  }, []);

  const value: FirebaseContextType = {
    isConnected,
    migrationStatus,
    migrationError,
    migratedCount
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebaseContext() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseContext must be used within a FirebaseProvider');
  }
  return context;
}
