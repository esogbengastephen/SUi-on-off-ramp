"use client";

import { useState, useEffect, useCallback } from 'react';
import { useCurrentWallet } from "@mysten/dapp-kit";
import { SuiClient } from '@mysten/sui.js/client';

// Real treasury data from smart contract
export interface RealTreasuryData {
  totalValueUSD: number;
  totalValueNGN: number;
  suiBalance: number;
  usdcBalance: number;
  usdtBalance: number;
  nairaBalance: number;
  healthScore: number;
  lastUpdated: Date;
}

// Real user data from Firebase
export interface RealUserData {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  pendingUsers: number;
  lastUpdated: Date;
}

// Real transaction data
export interface RealTransactionData {
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  dailyVolume: number;
  lastUpdated: Date;
}

export function useRealDashboardData() {
  const { currentWallet } = useCurrentWallet();
  const [treasuryData, setTreasuryData] = useState<RealTreasuryData>({
    totalValueUSD: 0,
    totalValueNGN: 0,
    suiBalance: 0,
    usdcBalance: 0,
    usdtBalance: 0,
    nairaBalance: 0,
    healthScore: 0,
    lastUpdated: new Date()
  });
  
  const [userData, setUserData] = useState<RealUserData>({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    lastUpdated: new Date()
  });
  
  const [transactionData, setTransactionData] = useState<RealTransactionData>({
    totalTransactions: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    dailyVolume: 0,
    lastUpdated: new Date()
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real treasury data from smart contract
  const fetchTreasuryData = useCallback(async () => {
    try {
      console.log('🚀 REAL DATA: Fetching treasury data from smart contract');
      
      // Get SUI balance from treasury address
      const treasuryAddress = "0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580";
      
      // Create SuiClient for testnet
      const client = new SuiClient({
        url: 'https://fullnode.testnet.sui.io:443'
      });
      
      // Get SUI balance
      const suiBalance = await client.getBalance({
        owner: treasuryAddress,
        coinType: '0x2::sui::SUI'
      });
      
      // Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
      const suiBalanceInSUI = parseInt(suiBalance.totalBalance) / 1_000_000_000;
      
      // Calculate USD value (assuming 1 SUI = $2.5)
      const usdValue = suiBalanceInSUI * 2.5;
      
      // Calculate NGN value (assuming 1 USD = 1500 NGN)
      const ngnValue = usdValue * 1500;
      
      // Calculate health score based on balance
      const healthScore = Math.min(100, Math.max(0, (suiBalanceInSUI / 10) * 100));
      
      const newTreasuryData: RealTreasuryData = {
        totalValueUSD: usdValue,
        totalValueNGN: ngnValue,
        suiBalance: suiBalanceInSUI,
        usdcBalance: 0, // TODO: Get USDC balance
        usdtBalance: 0, // TODO: Get USDT balance
        nairaBalance: 0, // TODO: Get Naira balance
        healthScore: healthScore,
        lastUpdated: new Date()
      };
      
      setTreasuryData(newTreasuryData);
      console.log('✅ REAL DATA: Treasury data fetched:', newTreasuryData);
      
    } catch (err: any) {
      console.error('❌ REAL DATA: Error fetching treasury data:', err);
      setError(err.message);
    }
  }, []);

  // Fetch real user data from Firebase
  const fetchUserData = useCallback(async () => {
    try {
      console.log('🚀 REAL DATA: Fetching user data from Firebase');
      
      const response = await fetch('/api/admin/users/stats');
      const data = await response.json();
      
      if (data.success) {
        const newUserData: RealUserData = {
          totalUsers: data.stats.totalUsers || 0,
          activeUsers: data.stats.activeUsers || 0,
          verifiedUsers: data.stats.verifiedUsers || 0,
          pendingUsers: data.stats.pendingUsers || 0,
          lastUpdated: new Date()
        };
        
        setUserData(newUserData);
        console.log('✅ REAL DATA: User data fetched:', newUserData);
      }
    } catch (err: any) {
      console.error('❌ REAL DATA: Error fetching user data:', err);
      // Don't set error for user data as it might not be implemented yet
    }
  }, []);

  // Fetch real transaction data
  const fetchTransactionData = useCallback(async () => {
    try {
      console.log('🚀 REAL DATA: Fetching transaction data');
      
      const response = await fetch('/api/admin/transactions/stats');
      const data = await response.json();
      
      if (data.success) {
        const newTransactionData: RealTransactionData = {
          totalTransactions: data.stats.totalTransactions || 0,
          pendingTransactions: data.stats.pendingTransactions || 0,
          completedTransactions: data.stats.completedTransactions || 0,
          failedTransactions: data.stats.failedTransactions || 0,
          dailyVolume: data.stats.dailyVolume || 0,
          lastUpdated: new Date()
        };
        
        setTransactionData(newTransactionData);
        console.log('✅ REAL DATA: Transaction data fetched:', newTransactionData);
      }
    } catch (err: any) {
      console.error('❌ REAL DATA: Error fetching transaction data:', err);
      // Don't set error for transaction data as it might not be implemented yet
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchTreasuryData(),
        fetchUserData(),
        fetchTransactionData()
      ]);
    } catch (err: any) {
      console.error('❌ REAL DATA: Error fetching all data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchTreasuryData, fetchUserData, fetchTransactionData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchAllData();
    
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchAllData]);

  return {
    treasuryData,
    userData,
    transactionData,
    loading,
    error,
    refresh: fetchAllData
  };
}
