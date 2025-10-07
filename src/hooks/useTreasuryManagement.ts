"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface TreasuryBalance {
  currency: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  lastUpdated: Date;
  treasuryId?: string;
}

export interface TreasuryTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'NAIRA_DEPOSIT' | 'SWAP_IN' | 'SWAP_OUT' | 'FEE_COLLECTION';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  description: string;
  transactionHash?: string;
  paystackReference?: string;
  adminAddress?: string;
  recipientAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useTreasuryManagement() {
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<TreasuryBalance[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/treasury/balance');
      const result = await response.json();
      
      if (result.success) {
        setBalances(result.balances.map((balance: any) => ({
          ...balance,
          lastUpdated: new Date(balance.lastUpdated)
        })));
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching treasury balances:', error);
      toast.error('Failed to fetch treasury balances');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (limit = 50, type = 'all', currency = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        type,
        currency
      });
      
      const response = await fetch(`/api/admin/treasury/transactions?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.transactions.map((tx: any) => ({
          ...tx,
          createdAt: new Date(tx.createdAt),
          updatedAt: new Date(tx.updatedAt)
        })));
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching treasury transactions:', error);
      toast.error('Failed to fetch treasury transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const depositToTreasury = useCallback(async (
    currency: string,
    amount: number,
    adminPrivateKey: string,
    description?: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/treasury/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          amount,
          adminPrivateKey,
          description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        await fetchBalances();
        await fetchTransactions();
        return result.transactionHash;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error depositing to treasury:', error);
      toast.error('Failed to deposit to treasury');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchBalances, fetchTransactions]);

  const withdrawFromTreasury = useCallback(async (
    currency: string,
    amount: number,
    adminPrivateKey: string,
    recipientAddress: string,
    description?: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/treasury/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          amount,
          adminPrivateKey,
          recipientAddress,
          description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        await fetchBalances();
        await fetchTransactions();
        return result.transactionHash;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error withdrawing from treasury:', error);
      toast.error('Failed to withdraw from treasury');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchBalances, fetchTransactions]);

  const depositNairaViaPaystack = useCallback(async (
    amount: number,
    email: string,
    bankCode: string,
    accountNumber: string,
    accountName?: string,
    description?: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/treasury/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          email,
          bankCode,
          accountNumber,
          accountName,
          description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        await fetchTransactions();
        return result.transferCode;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error depositing Naira via Paystack:', error);
      toast.error('Failed to deposit Naira via Paystack');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  const checkPaystackStatus = useCallback(async (transferCode: string) => {
    try {
      const response = await fetch(`/api/admin/treasury/paystack?transferCode=${transferCode}`);
      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error checking Paystack status:', error);
      throw error;
    }
  }, []);

  return {
    loading,
    balances,
    transactions,
    fetchBalances,
    fetchTransactions,
    depositToTreasury,
    withdrawFromTreasury,
    depositNairaViaPaystack,
    checkPaystackStatus
  };
}