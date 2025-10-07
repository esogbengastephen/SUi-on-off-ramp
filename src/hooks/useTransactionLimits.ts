"use client";

import { useState, useEffect, useCallback } from 'react';
import { TransactionLimits, DEFAULT_TRANSACTION_LIMITS, LimitValidationResult, TransactionType, TokenType } from '@/lib/transaction-limits-schema';
import { toast } from 'sonner';

export function useTransactionLimits() {
  const [limits, setLimits] = useState<TransactionLimits>(DEFAULT_TRANSACTION_LIMITS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current limits
  const fetchLimits = useCallback(async () => {
    try {
      console.log('🚀 TRANSACTION LIMITS: Fetching limits');
      
      const response = await fetch('/api/admin/transaction-limits');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch limits');
      }
      
      setLimits(data.limits);
      setError(null);
      
      console.log('✅ TRANSACTION LIMITS: Successfully fetched limits:', data.limits);
    } catch (err: any) {
      console.error('❌ TRANSACTION LIMITS: Error fetching limits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update limits
  const updateLimits = useCallback(async (newLimits: Partial<TransactionLimits>, updatedBy: string) => {
    try {
      console.log('🚀 TRANSACTION LIMITS: Updating limits');
      
      const response = await fetch('/api/admin/transaction-limits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limits: { ...limits, ...newLimits },
          updatedBy
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update limits');
      }
      
      setLimits(data.limits);
      toast.success('Transaction limits updated successfully');
      
      console.log('✅ TRANSACTION LIMITS: Successfully updated limits:', data.limits);
    } catch (err: any) {
      console.error('❌ TRANSACTION LIMITS: Error updating limits:', err);
      toast.error(err.message || 'Failed to update limits');
      throw err;
    }
  }, [limits]);

  // Validate transaction
  const validateTransaction = useCallback(async (
    transactionType: TransactionType,
    tokenType: TokenType,
    amount: number,
    nairaAmount?: number
  ): Promise<LimitValidationResult> => {
    try {
      console.log('🚀 TRANSACTION VALIDATION: Validating transaction');
      
      const response = await fetch('/api/admin/transaction-limits/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionType,
          tokenType,
          amount,
          nairaAmount
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to validate transaction');
      }
      
      console.log('✅ TRANSACTION VALIDATION: Validation result:', data.validation);
      return data.validation;
    } catch (err: any) {
      console.error('❌ TRANSACTION VALIDATION: Error validating transaction:', err);
      return {
        isValid: false,
        errors: [err.message || 'Failed to validate transaction'],
        warnings: []
      };
    }
  }, []);

  // Toggle limits active/inactive
  const toggleLimits = useCallback(async (isActive: boolean, updatedBy: string) => {
    await updateLimits({ isActive }, updatedBy);
  }, [updateLimits]);

  // Reset to default limits
  const resetToDefaults = useCallback(async (updatedBy: string) => {
    await updateLimits(DEFAULT_TRANSACTION_LIMITS, updatedBy);
  }, [updateLimits]);

  // Auto-fetch limits on mount
  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  return {
    limits,
    loading,
    error,
    fetchLimits,
    updateLimits,
    validateTransaction,
    toggleLimits,
    resetToDefaults
  };
}
