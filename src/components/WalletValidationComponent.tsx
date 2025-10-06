"use client";

import React, { useState, useEffect } from 'react';
import { useWalletValidation } from '@/hooks/useWalletValidation';

interface WalletValidationProps {
  userAddress: string;
  tokenType: 'SUI' | 'USDC' | 'USDT';
  swapAmount: number;
  onValidationChange?: (canProceed: boolean, errorMessage?: string) => void;
}

export function WalletValidationComponent({
  userAddress,
  tokenType,
  swapAmount,
  onValidationChange
}: WalletValidationProps) {
  const {
    isValidating,
    canProceed,
    errorMessage,
    balances,
    hasSufficientGas,
    validateWallet,
    refreshBalances
  } = useWalletValidation({
    userAddress,
    tokenType,
    swapAmount,
    autoCheck: true
  });

  // Notify parent component of validation changes
  useEffect(() => {
    onValidationChange?.(canProceed, errorMessage || undefined);
  }, [canProceed, errorMessage, onValidationChange]);

  // Format token amount for display
  const formatTokenAmount = (amount: number, decimals: number = 6) => {
    return amount.toFixed(decimals);
  };

  // Get token symbol
  const getTokenSymbol = (token: string) => {
    return token.toUpperCase();
  };

  // Get balance for current token
  const getCurrentTokenBalance = () => {
    if (!balances) return 0;
    switch (tokenType) {
      case 'SUI': return balances.sui;
      case 'USDC': return balances.usdc;
      case 'USDT': return balances.usdt;
      default: return 0;
    }
  };

  // Get required amount for current token
  const getRequiredAmount = () => {
    return swapAmount;
  };

  if (!userAddress) {
    return (
      <div className="wallet-validation">
        <div className="validation-status error">
          <div className="status-icon">⚠️</div>
          <div className="status-text">Please connect your wallet</div>
        </div>
      </div>
    );
  }

  if (swapAmount <= 0) {
    return (
      <div className="wallet-validation">
        <div className="validation-status info">
          <div className="status-icon">ℹ️</div>
          <div className="status-text">Enter swap amount to check wallet balance</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-validation">
      {/* Validation Status */}
      <div className={`validation-status ${canProceed ? 'success' : 'error'}`}>
        <div className="status-icon">
          {isValidating ? '⏳' : canProceed ? '✅' : '❌'}
        </div>
        <div className="status-text">
          {isValidating && 'Checking wallet balance...'}
          {!isValidating && canProceed && `Sufficient ${tokenType} and SUI for gas fees`}
          {!isValidating && !canProceed && errorMessage}
        </div>
      </div>

      {/* Balance Details */}
      {balances && !isValidating && (
        <div className="balance-details">
          <div className="balance-row">
            <span className="balance-label">{tokenType} Balance:</span>
            <span className="balance-value">
              {formatTokenAmount(getCurrentTokenBalance())} {getTokenSymbol(tokenType)}
            </span>
          </div>
          
          <div className="balance-row">
            <span className="balance-label">Required {tokenType}:</span>
            <span className="balance-value">
              {formatTokenAmount(getRequiredAmount())} {getTokenSymbol(tokenType)}
            </span>
          </div>
          
          <div className="balance-row">
            <span className="balance-label">SUI Balance:</span>
            <span className="balance-value">
              {formatTokenAmount(balances.sui, 4)} SUI
            </span>
          </div>
          
          <div className="balance-row">
            <span className="balance-label">Gas Fee Required:</span>
            <span className="balance-value">
              ~0.015 SUI
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="validation-actions">
        <button
          type="button"
          onClick={validateWallet}
          disabled={isValidating}
          className="btn-secondary"
        >
          {isValidating ? 'Checking...' : 'Recheck Balance'}
        </button>
        
        <button
          type="button"
          onClick={refreshBalances}
          disabled={isValidating}
          className="btn-secondary"
        >
          Refresh Balances
        </button>
      </div>

      {/* Styles */}
      <style jsx>{`
        .wallet-validation {
          margin: 1rem 0;
          padding: 1rem;
          border-radius: 8px;
          background-color: #f8f9fa;
        }

        .validation-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .validation-status.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .validation-status.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .validation-status.info {
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .status-icon {
          font-size: 1.2rem;
        }

        .status-text {
          font-weight: 500;
        }

        .balance-details {
          background-color: white;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .balance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f3f4;
        }

        .balance-row:last-child {
          border-bottom: none;
        }

        .balance-label {
          font-weight: 500;
          color: #6c757d;
        }

        .balance-value {
          font-weight: 600;
          color: #212529;
        }

        .validation-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .btn-secondary {
          padding: 0.5rem 1rem;
          border: 1px solid #6c757d;
          background-color: white;
          color: #6c757d;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
