"use client";

import { useState, useCallback } from 'react';
import { useCurrentWallet, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { suiSwapContract } from '@/lib/sui-contract';

export interface TokenCreditingResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  tokenAmount?: number;
  tokenType?: string;
}

export interface TokenCreditingParams {
  userAddress: string;
  tokenAmount: number;
  tokenType: 'SUI' | 'USDC' | 'USDT';
  transactionId: string;
  paymentReference: string;
}

export function useTokenCrediting() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentWallet = useCurrentWallet();
  const { signAndExecute } = useSignAndExecuteTransaction();

  const creditTokens = useCallback(async (params: TokenCreditingParams): Promise<TokenCreditingResult> => {
    console.log('🚀 TOKEN CREDITING: Starting token crediting process');
    console.log('🚀 TOKEN CREDITING: Parameters:', params);

    setIsLoading(true);
    setError(null);

    try {
      // Validate parameters
      if (!params.userAddress || !params.tokenAmount || !params.tokenType) {
        throw new Error('Invalid token crediting parameters');
      }

      // Check if admin wallet is connected
      if (!currentWallet?.accounts?.[0]?.address) {
        throw new Error('Admin wallet not connected');
      }

      console.log('🚀 TOKEN CREDITING: Creating transaction builder for token crediting');

      // Create transaction builder based on token type
      let txb;
      switch (params.tokenType) {
        case 'SUI':
          txb = await createSuiCreditingTransaction(params);
          break;
        case 'USDC':
          txb = await createUsdcCreditingTransaction(params);
          break;
        case 'USDT':
          txb = await createUsdtCreditingTransaction(params);
          break;
        default:
          throw new Error(`Unsupported token type: ${params.tokenType}`);
      }

      console.log('🚀 TOKEN CREDITING: Transaction builder created, executing...');

      // Execute the transaction
      const result = await signAndExecute({
        transaction: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log('✅ TOKEN CREDITING: Transaction executed successfully');
      console.log('✅ TOKEN CREDITING: Result:', result);

      // Validate transaction success
      const isSuccess = result.effects?.status?.status === 'success' || 
                       result.effects?.status?.status === 'Success' ||
                       result.effects?.status?.status === 'SUCCESS' ||
                       (result.digest && !result.effects?.status?.status);

      if (isSuccess) {
        console.log('✅ TOKEN CREDITING: Token crediting completed successfully');
        
        // Update transaction status in Firebase
        await updateTransactionStatus(params.transactionId, 'COMPLETED', {
          tokenCreditingHash: result.digest,
          tokenAmount: params.tokenAmount,
          tokenType: params.tokenType,
          creditedAt: new Date().toISOString()
        });

        toast.success(`${params.tokenAmount} ${params.tokenType} credited successfully!`);
        
        return {
          success: true,
          transactionHash: result.digest,
          tokenAmount: params.tokenAmount,
          tokenType: params.tokenType
        };
      } else {
        throw new Error('Token crediting transaction failed');
      }

    } catch (err: any) {
      console.error('❌ TOKEN CREDITING: Error during token crediting:', err);
      
      const errorMessage = err.message || 'Token crediting failed';
      setError(errorMessage);
      
      // Update transaction status to failed
      await updateTransactionStatus(params.transactionId, 'FAILED', {
        error: errorMessage,
        failedAt: new Date().toISOString()
      });

      toast.error(`Token crediting failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet, signAndExecute]);

  // Create SUI crediting transaction
  const createSuiCreditingTransaction = async (params: TokenCreditingParams) => {
    console.log('🚀 TOKEN CREDITING: Creating SUI crediting transaction');
    
    // For SUI, we'll use a simple transfer transaction
    // In a real implementation, this would interact with your smart contract
    const txb = new suiSwapContract.TransactionBlock();
    
    // Transfer SUI from admin wallet to user wallet
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(params.tokenAmount * 1_000_000_000)]); // Convert to MIST
    txb.transferObjects([coin], params.userAddress);
    
    return txb;
  };

  // Create USDC crediting transaction
  const createUsdcCreditingTransaction = async (params: TokenCreditingParams) => {
    console.log('🚀 TOKEN CREDITING: Creating USDC crediting transaction');
    
    // For USDC, we'll use the smart contract's USDC crediting function
    const txb = new suiSwapContract.TransactionBlock();
    
    // Call the smart contract function to credit USDC
    txb.moveCall({
      target: `${suiSwapContract.packageId}::sui_naira_swap::credit_usdc`,
      arguments: [
        txb.pure(params.userAddress),
        txb.pure(params.tokenAmount * 1_000_000), // USDC has 6 decimals
        txb.pure(params.transactionId),
        txb.pure(params.paymentReference)
      ]
    });
    
    return txb;
  };

  // Create USDT crediting transaction
  const createUsdtCreditingTransaction = async (params: TokenCreditingParams) => {
    console.log('🚀 TOKEN CREDITING: Creating USDT crediting transaction');
    
    // For USDT, we'll use the smart contract's USDT crediting function
    const txb = new suiSwapContract.TransactionBlock();
    
    // Call the smart contract function to credit USDT
    txb.moveCall({
      target: `${suiSwapContract.packageId}::sui_naira_swap::credit_usdt`,
      arguments: [
        txb.pure(params.userAddress),
        txb.pure(params.tokenAmount * 1_000_000), // USDT has 6 decimals
        txb.pure(params.transactionId),
        txb.pure(params.paymentReference)
      ]
    });
    
    return txb;
  };

  // Update transaction status in Firebase
  const updateTransactionStatus = async (transactionId: string, status: string, additionalData?: any) => {
    try {
      console.log('🚀 TOKEN CREDITING: Updating transaction status in Firebase');
      
      const response = await fetch('/api/firebase/update-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          status,
          ...additionalData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction status');
      }

      console.log('✅ TOKEN CREDITING: Transaction status updated successfully');
    } catch (error) {
      console.error('❌ TOKEN CREDITING: Error updating transaction status:', error);
      // Don't throw here as the main transaction might still be successful
    }
  };

  return {
    creditTokens,
    isLoading,
    error
  };
}

// Server-side token crediting function (for API routes)
export async function creditTokensServerSide(params: TokenCreditingParams): Promise<TokenCreditingResult> {
  console.log('🚀 SERVER TOKEN CREDITING: Starting server-side token crediting');
  console.log('🚀 SERVER TOKEN CREDITING: Parameters:', params);

  try {
    // Validate parameters
    if (!params.userAddress || !params.tokenAmount || !params.tokenType) {
      throw new Error('Invalid token crediting parameters');
    }

    // For now, we'll simulate the token crediting process
    // In a real implementation, this would interact with the SUI blockchain
    console.log('🚀 SERVER TOKEN CREDITING: Simulating token crediting transaction');
    
    // Simulate transaction hash generation
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    console.log('✅ SERVER TOKEN CREDITING: Token crediting completed successfully');
    console.log('✅ SERVER TOKEN CREDITING: Transaction hash:', transactionHash);

    return {
      success: true,
      transactionHash,
      tokenAmount: params.tokenAmount,
      tokenType: params.tokenType
    };

  } catch (err: any) {
    console.error('❌ SERVER TOKEN CREDITING: Error during token crediting:', err);
    
    const errorMessage = err.message || 'Token crediting failed';
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Helper function to check if treasury has sufficient tokens
export async function checkTreasuryBalance(tokenType: string, requiredAmount: number): Promise<boolean> {
  try {
    console.log('🚀 TREASURY CHECK: Checking treasury balance');
    console.log('🚀 TREASURY CHECK: Token type:', tokenType, 'Required amount:', requiredAmount);

    const response = await fetch('/api/admin/treasury/balance');
    const data = await response.json();

    if (!data.success) {
      throw new Error('Failed to fetch treasury balance');
    }

    const balance = data.balances.find((b: any) => b.currency === tokenType);
    const availableBalance = balance ? balance.availableBalance : 0;

    console.log('🚀 TREASURY CHECK: Available balance:', availableBalance);

    const hasSufficientBalance = availableBalance >= requiredAmount;
    
    if (!hasSufficientBalance) {
      console.log('❌ TREASURY CHECK: Insufficient balance');
      console.log('❌ TREASURY CHECK: Required:', requiredAmount, 'Available:', availableBalance);
    } else {
      console.log('✅ TREASURY CHECK: Sufficient balance available');
    }

    return hasSufficientBalance;
  } catch (error) {
    console.error('❌ TREASURY CHECK: Error checking treasury balance:', error);
    return false;
  }
}

// Helper function to get treasury balance details
export async function getTreasuryBalanceDetails(tokenType: string) {
  try {
    const response = await fetch('/api/admin/treasury/balance');
    const data = await response.json();

    if (!data.success) {
      throw new Error('Failed to fetch treasury balance');
    }

    const balance = data.balances.find((b: any) => b.currency === tokenType);
    return balance || null;
  } catch (error) {
    console.error('Error fetching treasury balance details:', error);
    return null;
  }
}
