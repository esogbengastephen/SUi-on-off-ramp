"use client";

import React from 'react';
import { FixedOffRampForm } from '@/components/FixedOffRampForm';

export default function TestOffRampPage() {
  const [userAddress, setUserAddress] = React.useState('');
  const [transactionResult, setTransactionResult] = React.useState<{
    success: boolean;
    message: string;
    transactionId?: string;
  } | null>(null);

  const handleTransactionComplete = (result: {
    success: boolean;
    message: string;
    transactionId?: string;
  }) => {
    setTransactionResult(result);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>OFF-RAMP Wallet Validation Test</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <label htmlFor="userAddress" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Test User Address:
        </label>
        <input
          id="userAddress"
          type="text"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="Enter wallet address to test"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e1e5e9',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        />
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          Use your wallet address: 0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580
        </p>
      </div>

      {/* Transaction Result */}
      {transactionResult && (
        <div style={{
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '2rem',
          backgroundColor: transactionResult.success ? '#d4edda' : '#f8d7da',
          color: transactionResult.success ? '#155724' : '#721c24',
          border: `1px solid ${transactionResult.success ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <h3>{transactionResult.success ? '✅ Success!' : '❌ Error'}</h3>
          <p>{transactionResult.message}</p>
          {transactionResult.transactionId && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              Transaction ID: {transactionResult.transactionId}
            </p>
          )}
        </div>
      )}

      {/* Fixed OFF-RAMP Form */}
      {userAddress && (
        <FixedOffRampForm
          userAddress={userAddress}
          onTransactionComplete={handleTransactionComplete}
        />
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #dee2e6'
      }}>
        <h3>Test Instructions:</h3>
        <ol>
          <li>Enter your wallet address above</li>
          <li>Select a token (SUI, USDC, or USDT)</li>
          <li>Enter an amount to swap</li>
          <li>Fill in bank details</li>
          <li>The system will check your wallet balance and gas fees</li>
          <li>If insufficient funds, you'll see an error message</li>
          <li>If sufficient funds, the transaction will proceed</li>
        </ol>
        
        <h4>Expected Behavior:</h4>
        <ul>
          <li><strong>Insufficient SUI for gas:</strong> "Insufficient gas fee to complete transaction"</li>
          <li><strong>Insufficient token amount:</strong> "Insufficient [TOKEN] for swap"</li>
          <li><strong>Sufficient funds:</strong> Transaction proceeds normally</li>
          <li><strong>Contract error:</strong> "Smart contract not properly configured"</li>
        </ul>
      </div>
    </div>
  );
}
