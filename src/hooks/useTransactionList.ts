"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  type: 'on_ramp' | 'off_ramp' | 'unknown';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  userAddress: string;
  suiAmount: number;
  nairaAmount: number;
  exchangeRate: number;
  createdAt: Date;
  updatedAt: Date;
  transactionHash?: string | null;
  paystackReference?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface TransactionListData {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTransactions: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search: string;
    status: string;
    type: string;
  };
  lastUpdated: string;
}

export function useTransactionList() {
  const [data, setData] = useState<TransactionListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionList = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = 'all',
    type: string = 'all'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
        type,
      }).toString();
      
      const response = await fetch(`/api/admin/transactions/list?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transaction list');
      }
      
      const result = await response.json();
      
      // Convert date strings back to Date objects
      const transactionsWithDates = result.data.transactions.map((transaction: any) => ({
        ...transaction,
        createdAt: new Date(transaction.createdAt),
        updatedAt: new Date(transaction.updatedAt),
      }));
      
      setData({ ...result.data, transactions: transactionsWithDates });
    } catch (err: any) {
      console.error('Error fetching transaction list:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactionList();
  }, [fetchTransactionList]);

  return { data, loading, error, refreshTransactionList: fetchTransactionList };
}
