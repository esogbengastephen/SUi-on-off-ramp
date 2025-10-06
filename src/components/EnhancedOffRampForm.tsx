"use client";

import React, { useState, useEffect } from 'react';
import { WalletValidationComponent } from '@/components/WalletValidationComponent';
import { validateUserWalletForOffRamp } from '@/utils/suiWalletValidation';

interface OffRampFormData {
  tokenType: 'SUI' | 'USDC' | 'USDT';
  amount: number;
  userAddress: string;
  bankAccount: string;
  bankName: string;
}

interface OffRampFormProps {
  userAddress: string;
  onSubmit: (data: OffRampFormData) => Promise<void>;
}

export function EnhancedOffRampForm({ userAddress, onSubmit }: OffRampFormProps) {
  const [formData, setFormData] = useState<OffRampFormData>({
    tokenType: 'SUI',
    amount: 0,
    userAddress: userAddress,
    bankAccount: '',
    bankName: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canProceed, setCanProceed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Handle form input changes
  const handleInputChange = (field: keyof OffRampFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  // Handle validation change from WalletValidationComponent
  const handleValidationChange = (canProceed: boolean, errorMessage?: string) => {
    setCanProceed(canProceed);
    if (errorMessage && !canProceed) {
      setError(errorMessage);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canProceed) {
      setError('Please ensure you have sufficient tokens and gas fees');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Final validation before submission
      const validation = await validateUserWalletForOffRamp(
        userAddress,
        formData.tokenType,
        formData.amount
      );

      if (!validation.canProceed) {
        throw new Error(validation.errorMessage || 'Insufficient funds');
      }

      // Submit the form
      await onSubmit(formData);
      
      // Success - form will be reset by parent component
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setError(errorMessage);
      
      // Start countdown for form reset
      startCountdown();
      
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
      bankName: ''
    });
    setError(null);
    setCanProceed(false);
    setCountdown(null);
  };

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [formData.amount, formData.tokenType, formData.bankAccount, formData.bankName]);

  return (
    <div className="enhanced-offramp-form">
      <form onSubmit={handleSubmit} className="offramp-form">
        <h2>OFF-RAMP Transaction</h2>
        
        {/* Token Selection */}
        <div className="form-group">
          <label htmlFor="tokenType">Select Token:</label>
          <select
            id="tokenType"
            value={formData.tokenType}
            onChange={(e) => handleInputChange('tokenType', e.target.value as 'SUI' | 'USDC' | 'USDT')}
            className="form-control"
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
          />
        </div>

        {/* Wallet Validation Component */}
        {formData.amount > 0 && (
          <WalletValidationComponent
            userAddress={userAddress}
            tokenType={formData.tokenType}
            swapAmount={formData.amount}
            onValidationChange={handleValidationChange}
          />
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
        .enhanced-offramp-form {
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
