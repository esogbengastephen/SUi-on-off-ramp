"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  validateUserWalletForOffRamp, 
  getAllTokenBalances, 
  hasSufficientGasFee,
  WalletBalances,
  WalletValidationResult 
} from '@/utils/suiWalletValidation';
import { 
  saveUserWalletBalances, 
  logWalletValidation 
} from '@/utils/firebaseWalletMonitoring';

export interface UseWalletValidationProps {
  userAddress: string;
  tokenType: 'SUI' | 'USDC' | 'USDT';
  swapAmount: number;
  autoCheck?: boolean;
}

export interface UseWalletValidationReturn {
  // Validation state
  isValidating: boolean;
  validationResult: WalletValidationResult | null;
  canProceed: boolean;
  errorMessage: string | null;
  
  // Balance information
  balances: WalletBalances | null;
  hasSufficientGas: boolean;
  
  // Actions
  validateWallet: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  clearValidation: () => void;
}

/**
 * Hook for validating user wallet for OFF-RAMP transactions
 */
export function useWalletValidation({
  userAddress,
  tokenType,
  swapAmount,
  autoCheck = true
}: UseWalletValidationProps): UseWalletValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<WalletValidationResult | null>(null);
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [hasSufficientGas, setHasSufficientGas] = useState(false);

  // Validate wallet function
  const validateWallet = useCallback(async () => {
    if (!userAddress || swapAmount <= 0) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateUserWalletForOffRamp(userAddress, tokenType, swapAmount);
      setValidationResult(result);
      
      // Save balances to Firebase (optional, don't fail validation if this fails)
      try {
        await saveUserWalletBalances(userAddress, result.balances);
      } catch (firebaseError) {
        console.warn('Failed to save wallet balances to Firebase:', firebaseError);
      }

      // Log validation to Firebase (optional, don't fail validation if this fails)
      try {
        await logWalletValidation(
          userAddress,
          tokenType,
          swapAmount,
          result.canProceed,
          result.errorMessage,
          result.balances,
          result.required
        );
      } catch (firebaseError) {
        console.warn('Failed to log wallet validation to Firebase:', firebaseError);
      }
      
    } catch (error) {
      console.error('Error validating wallet:', error);
      setValidationResult({
        canProceed: false,
        errorMessage: 'Error checking wallet balance',
        balances: { sui: 0, usdc: 0, usdt: 0 },
        required: { swapToken: swapAmount, gasFee: 0.015 }
      });
    } finally {
      setIsValidating(false);
    }
  }, [userAddress, tokenType, swapAmount]);

  // Refresh balances function
  const refreshBalances = useCallback(async () => {
    if (!userAddress) return;

    try {
      const [allBalances, gasCheck] = await Promise.all([
        getAllTokenBalances(userAddress),
        hasSufficientGasFee(userAddress)
      ]);
      
      setBalances(allBalances);
      setHasSufficientGas(gasCheck.hasSufficient);
    } catch (error) {
      console.error('Error refreshing balances:', error);
    }
  }, [userAddress]);

  // Clear validation function
  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setBalances(null);
    setHasSufficientGas(false);
  }, []);

  // Auto-check when dependencies change
  useEffect(() => {
    if (autoCheck && userAddress && swapAmount > 0) {
      validateWallet();
    }
  }, [autoCheck, userAddress, tokenType, swapAmount, validateWallet]);

  // Auto-refresh balances when user address changes
  useEffect(() => {
    if (userAddress) {
      refreshBalances();
    }
  }, [userAddress, refreshBalances]);

  return {
    isValidating,
    validationResult,
    canProceed: validationResult?.canProceed ?? false,
    errorMessage: validationResult?.errorMessage ?? null,
    balances,
    hasSufficientGas,
    validateWallet,
    refreshBalances,
    clearValidation
  };
}

/**
 * Hook for checking gas fee sufficiency only
 */
export function useGasFeeCheck(userAddress: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [hasSufficient, setHasSufficient] = useState(false);
  const [suiBalance, setSuiBalance] = useState(0);
  const [estimatedGasFee, setEstimatedGasFee] = useState(0);

  const checkGasFee = useCallback(async () => {
    if (!userAddress) return;

    setIsChecking(true);
    try {
      const result = await hasSufficientGasFee(userAddress);
      setHasSufficient(result.hasSufficient);
      setSuiBalance(result.suiBalance);
      setEstimatedGasFee(result.estimatedGasFee);
    } catch (error) {
      console.error('Error checking gas fee:', error);
      setHasSufficient(false);
    } finally {
      setIsChecking(false);
    }
  }, [userAddress]);

  useEffect(() => {
    if (userAddress) {
      checkGasFee();
    }
  }, [userAddress, checkGasFee]);

  return {
    isChecking,
    hasSufficient,
    suiBalance,
    estimatedGasFee,
    checkGasFee
  };
}

/**
 * Hook for getting all token balances
 */
export function useTokenBalances(userAddress: string) {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    try {
      const result = await getAllTokenBalances(userAddress);
      setBalances(result);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setBalances(null);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    if (userAddress) {
      fetchBalances();
    }
  }, [userAddress, fetchBalances]);

  return {
    balances,
    isLoading,
    fetchBalances
  };
}
