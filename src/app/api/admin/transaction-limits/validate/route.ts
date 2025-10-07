import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { TransactionLimits, DEFAULT_TRANSACTION_LIMITS, LimitValidationResult, TransactionType, TokenType } from '@/lib/transaction-limits-schema';

// Validate transaction against limits
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 TRANSACTION VALIDATION: Validating transaction against limits');
    
    const body = await request.json();
    const { transactionType, tokenType, amount, nairaAmount } = body;
    
    if (!transactionType || !tokenType || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Transaction type, token type, and amount are required'
      }, { status: 400 });
    }
    
    // Get current limits
    const limitsDoc = await adminDb.collection('transactionLimits').doc('current').get();
    const limits = limitsDoc.exists ? 
      limitsDoc.data() as TransactionLimits : 
      DEFAULT_TRANSACTION_LIMITS;
    
    // Validate transaction
    const validation = validateTransaction(limits, transactionType, tokenType, amount, nairaAmount);
    
    console.log('✅ TRANSACTION VALIDATION: Validation result:', validation);
    
    return NextResponse.json({
      success: true,
      validation
    });
    
  } catch (error: any) {
    console.error('❌ TRANSACTION VALIDATION: Error validating transaction:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to validate transaction'
    }, { status: 500 });
  }
}

// Validate a single transaction against limits
function validateTransaction(
  limits: TransactionLimits,
  transactionType: TransactionType,
  tokenType: TokenType,
  amount: number,
  nairaAmount?: number
): LimitValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!limits.isActive) {
    warnings.push('Transaction limits are currently disabled');
    return { isValid: true, errors, warnings };
  }
  
  const limitsToCheck = transactionType === 'on_ramp' ? limits.onRamp : limits.offRamp;
  
  // Validate token amount
  switch (tokenType) {
    case 'SUI':
      if (amount < limitsToCheck.minSuiAmount) {
        errors.push(`Minimum SUI amount is ${limitsToCheck.minSuiAmount}`);
      }
      if (amount > limitsToCheck.maxSuiAmount) {
        errors.push(`Maximum SUI amount is ${limitsToCheck.maxSuiAmount}`);
      }
      break;
      
    case 'USDC':
      if (amount < limitsToCheck.minUsdcAmount) {
        errors.push(`Minimum USDC amount is ${limitsToCheck.minUsdcAmount}`);
      }
      if (amount > limitsToCheck.maxUsdcAmount) {
        errors.push(`Maximum USDC amount is ${limitsToCheck.maxUsdcAmount}`);
      }
      break;
      
    case 'USDT':
      if (amount < limitsToCheck.minUsdtAmount) {
        errors.push(`Minimum USDT amount is ${limitsToCheck.minUsdtAmount}`);
      }
      if (amount > limitsToCheck.maxUsdtAmount) {
        errors.push(`Maximum USDT amount is ${limitsToCheck.maxUsdtAmount}`);
      }
      break;
      
    case 'NAIRA':
      if (amount < limitsToCheck.minNairaAmount) {
        errors.push(`Minimum Naira amount is ₦${limitsToCheck.minNairaAmount.toLocaleString()}`);
      }
      if (amount > limitsToCheck.maxNairaAmount) {
        errors.push(`Maximum Naira amount is ₦${limitsToCheck.maxNairaAmount.toLocaleString()}`);
      }
      break;
  }
  
  // Validate Naira amount if provided
  if (nairaAmount !== undefined) {
    if (nairaAmount < limitsToCheck.minNairaAmount) {
      errors.push(`Minimum Naira amount is ₦${limitsToCheck.minNairaAmount.toLocaleString()}`);
    }
    if (nairaAmount > limitsToCheck.maxNairaAmount) {
      errors.push(`Maximum Naira amount is ₦${limitsToCheck.maxNairaAmount.toLocaleString()}`);
    }
  }
  
  // Add warnings for high amounts
  if (amount > limitsToCheck.maxSuiAmount * 0.8) {
    warnings.push('Transaction amount is close to the maximum limit');
  }
  if (nairaAmount && nairaAmount > limitsToCheck.maxNairaAmount * 0.8) {
    warnings.push('Naira amount is close to the maximum limit');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
