"use client";

import React, { useState, useEffect } from 'react';
import { validateUserWalletForOffRampNoFirebase } from '@/utils/suiWalletValidationNoFirebase';

export default function SimpleWalletTest() {
  const [userAddress, setUserAddress] = useState('0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580');
  const [tokenType, setTokenType] = useState<'SUI' | 'USDC' | 'USDT'>('SUI');
  const [amount, setAmount] = useState(0.1);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testValidation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing validation with:', { userAddress, tokenType, amount });
      const validationResult = await validateUserWalletForOffRampNoFirebase(userAddress, tokenType, amount);
      console.log('Validation result:', validationResult);
      setResult(validationResult);
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userAddress && amount > 0) {
      testValidation();
    }
  }, [userAddress, tokenType, amount]);

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Simple Wallet Validation Test</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Wallet Address:</label>
        <input
          type="text"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Token Type:</label>
        <select
          value={tokenType}
          onChange={(e) => setTokenType(e.target.value as 'SUI' | 'USDC' | 'USDT')}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc' }}
        >
          <option value="SUI">SUI</option>
          <option value="USDC">USDC</option>
          <option value="USDT">USDT</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          step="0.01"
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc' }}
        />
      </div>

      <button
        onClick={testValidation}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Validation'}
      </button>

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: result.canProceed ? '#d4edda' : '#f8d7da',
          color: result.canProceed ? '#155724' : '#721c24',
          border: `1px solid ${result.canProceed ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          <h3>{result.canProceed ? '✅ Validation Passed' : '❌ Validation Failed'}</h3>
          <p><strong>Error Message:</strong> {result.errorMessage || 'None'}</p>
          <p><strong>SUI Balance:</strong> {result.balances.sui} SUI</p>
          <p><strong>USDC Balance:</strong> {result.balances.usdc} USDC</p>
          <p><strong>USDT Balance:</strong> {result.balances.usdt} USDT</p>
          <p><strong>Required Token:</strong> {result.required.swapToken} {tokenType}</p>
          <p><strong>Required Gas:</strong> {result.required.gasFee} SUI</p>
        </div>
      )}
    </div>
  );
}
