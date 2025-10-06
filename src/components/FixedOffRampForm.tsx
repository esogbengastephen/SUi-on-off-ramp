"use client";

import React, { useState, useEffect } from 'react';
import { useWalletValidation } from '@/hooks/useWalletValidation';
import { validateUserWalletForOffRamp } from '@/utils/suiWalletValidation';

interface OffRampTransactionData {
  tokenType: 'SUI' | 'USDC' | 'USDT';
  amount: number;
  userAddress: string;
  bankAccount: string;
  bankName: string;
  bankCode: string;
}

interface FixedOffRampFormProps {
  userAddress: string;
  onTransactionComplete: (result: { success: boolean; message: string; transactionId?: string }) => void;
}

export function FixedOffRampForm({ userAddress, onTransactionComplete }: FixedOffRampFormProps) {
  const [formData, setFormData] = useState<OffRampTransactionData>({
    tokenType: 'SUI',
    amount: 0,
    userAddress: userAddress,
    bankAccount: '',
    bankName: '',
    bankCode: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canProceed, setCanProceed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Use wallet validation hook
  const {
    isValidating,
    canProceed: validationCanProceed,
    errorMessage: validationError,
    balances,
    validateWallet
  } = useWalletValidation({
    userAddress,
    tokenType: formData.tokenType,
    swapAmount: formData.amount,
    autoCheck: true
  });

  // Update canProceed based on validation
  useEffect(() => {
    setCanProceed(validationCanProceed && formData.amount > 0 && !!formData.bankAccount && !!formData.bankName);
  }, [validationCanProceed, formData.amount, formData.bankAccount, formData.bankName]);

  // Handle form input changes
  const handleInputChange = (field: keyof OffRampTransactionData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  // Handle form submission with proper validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canProceed) {
      setError('Please ensure you have sufficient tokens and gas fees');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // CRITICAL: Final validation before any transaction
      const validation = await validateUserWalletForOffRamp(
        userAddress,
        formData.tokenType,
        formData.amount
      );

      if (!validation.canProceed) {
        throw new Error(validation.errorMessage || 'Insufficient funds');
      }

      // Check if contract is properly configured
      const contractId = process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID;
      const packageId = process.env.NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID;

      if (!contractId || !packageId) {
        throw new Error('Smart contract not properly configured. Please contact support.');
      }

      // Proceed with OFF-RAMP transaction
      console.log('Processing OFF-RAMP with validated wallet:', {
        userAddress,
        tokenType: formData.tokenType,
        amount: formData.amount,
        balances: validation.balances,
        required: validation.required
      });

      // Here you would call your existing OFF-RAMP logic
      // For now, simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success
      onTransactionComplete({
        success: true,
        message: 'OFF-RAMP transaction processed successfully!',
        transactionId: `tx_${Date.now()}`
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setError(errorMessage);
      
      // Start countdown for form reset
      startCountdown();
      
      // Notify parent of failure
      onTransactionComplete({
        success: false,
        message: errorMessage
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start countdown for form reset
  const startCountdown = () => {
    setCountdown(5);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          resetForm();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Reset form function
  const resetForm = () => {
    setFormData({
      tokenType: 'SUI',
      amount: 0,
      userAddress: userAddress,
      bankAccount: '',
      bankName: '',
      bankCode: ''
    });
    setError(null);
    setCanProceed(false);
    setCountdown(null);
  };

  return (
    <div className="fixed-offramp-form">
      <form onSubmit={handleSubmit} className="offramp-form">
        <h2>OFF-RAMP Transaction</h2>
        
        {/* Contract Configuration Check */}
        {(!process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || !process.env.NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID) && (
          <div className="config-error">
            <div className="error-icon">⚠️</div>
            <div className="error-text">
              <h3>Configuration Error</h3>
              <p>Smart contract is not properly configured. Please contact support.</p>
              <small>Missing: Contract ID or Package ID</small>
            </div>
          </div>
        )}

        {/* Token Selection */}
        <div className="form-group">
          <label htmlFor="tokenType">Select Token:</label>
          <select
            id="tokenType"
            value={formData.tokenType}
            onChange={(e) => handleInputChange('tokenType', e.target.value as 'SUI' | 'USDC' | 'USDT')}
            className="form-control"
            disabled={isSubmitting}
          >
            <option value="SUI">SUI</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
          </select>
        </div>

        {/* Amount Input */}
        <div className="form-group">
          <label htmlFor="amount">Amount to Swap:</label>
          <input
            type="number"
            id="amount"
            value={formData.amount || ''}
            onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
            placeholder="Enter amount"
            min="0"
            step="0.000001"
            className="form-control"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Bank Account */}
        <div className="form-group">
          <label htmlFor="bankAccount">Bank Account Number:</label>
          <input
            type="text"
            id="bankAccount"
            value={formData.bankAccount}
            onChange={(e) => handleInputChange('bankAccount', e.target.value)}
            placeholder="Enter bank account number"
            className="form-control"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Bank Name */}
        <div className="form-group">
          <label htmlFor="bankName">Bank Name:</label>
          <input
            type="text"
            id="bankName"
            value={formData.bankName}
            onChange={(e) => handleInputChange('bankName', e.target.value)}
            placeholder="Enter bank name"
            className="form-control"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Bank Code */}
        <div className="form-group">
          <label htmlFor="bankCode">Bank Code:</label>
          <input
            type="text"
            id="bankCode"
            value={formData.bankCode}
            onChange={(e) => handleInputChange('bankCode', e.target.value)}
            placeholder="Enter bank code"
            className="form-control"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Wallet Validation Status */}
        {formData.amount > 0 && (
          <div className="wallet-validation-status">
            <div className={`status-indicator ${validationCanProceed ? 'success' : 'error'}`}>
              <div className="status-icon">
                {isValidating ? '⏳' : validationCanProceed ? '✅' : '❌'}
              </div>
              <div className="status-text">
                {isValidating && 'Checking wallet balance...'}
                {!isValidating && validationCanProceed && `Sufficient ${formData.tokenType} and SUI for gas fees`}
                {!isValidating && !validationCanProceed && validationError}
              </div>
            </div>

            {/* Balance Details */}
            {balances && !isValidating && (
              <div className="balance-details">
                <div className="balance-row">
                  <span>{formData.tokenType} Balance:</span>
                  <span>{balances[formData.tokenType.toLowerCase() as keyof typeof balances].toFixed(6)} {formData.tokenType}</span>
                </div>
                <div className="balance-row">
                  <span>Required {formData.tokenType}:</span>
                  <span>{formData.amount} {formData.tokenType}</span>
                </div>
                <div className="balance-row">
                  <span>SUI Balance:</span>
                  <span>{balances.sui.toFixed(4)} SUI</span>
                </div>
                <div className="balance-row">
                  <span>Gas Fee Required:</span>
                  <span>~0.015 SUI</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <div className="error-icon">❌</div>
            <div className="error-text">
              {error}
              {countdown && (
                <div className="countdown">
                  Resetting form in {countdown} seconds...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canProceed || isSubmitting || !!error}
          className={`submit-button ${canProceed ? 'enabled' : 'disabled'}`}
        >
          {isSubmitting ? 'Processing...' : 'Process OFF-RAMP'}
        </button>
      </form>

      {/* Styles */}
      <style jsx>{`
        .fixed-offramp-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }

        .offramp-form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .offramp-form h2 {
          margin-bottom: 2rem;
          color: #333;
          text-align: center;
        }

        .config-error {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 1rem;
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .config-error h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .config-error p {
          margin: 0 0 0.5rem 0;
        }

        .config-error small {
          font-family: monospace;
          opacity: 0.8;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #555;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
        }

        .form-control:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }

        .wallet-validation-status {
          margin: 1.5rem 0;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 6px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .status-indicator.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-indicator.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
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

        .balance-row span:first-child {
          font-weight: 500;
          color: #6c757d;
        }

        .balance-row span:last-child {
          font-weight: 600;
          color: #212529;
        }

        .error-message {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 1rem;
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          margin: 1rem 0;
        }

        .error-icon {
          font-size: 1.2rem;
          margin-top: 0.1rem;
        }

        .error-text {
          flex: 1;
        }

        .countdown {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 6px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
        }

        .submit-button.enabled {
          background-color: #28a745;
          color: white;
        }

        .submit-button.enabled:hover:not(:disabled) {
          background-color: #218838;
        }

        .submit-button.disabled {
          background-color: #6c757d;
          color: #adb5bd;
          cursor: not-allowed;
        }

        .submit-button:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
