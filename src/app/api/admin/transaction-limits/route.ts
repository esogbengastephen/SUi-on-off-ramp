import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { TransactionLimits, DEFAULT_TRANSACTION_LIMITS, LimitValidationResult, TransactionType, TokenType } from '@/lib/transaction-limits-schema';

// Get current transaction limits
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TRANSACTION LIMITS: Fetching current limits');
    
    const limitsDoc = await adminDb.collection('transactionLimits').doc('current').get();
    
    if (!limitsDoc.exists) {
      // Return default limits if none exist
      console.log('📝 TRANSACTION LIMITS: No limits found, returning defaults');
      return NextResponse.json({
        success: true,
        limits: DEFAULT_TRANSACTION_LIMITS
      });
    }
    
    const limits = limitsDoc.data() as TransactionLimits;
    console.log('✅ TRANSACTION LIMITS: Successfully fetched limits:', limits);
    
    return NextResponse.json({
      success: true,
      limits
    });
    
  } catch (error: any) {
    console.error('❌ TRANSACTION LIMITS: Error fetching limits:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch transaction limits'
    }, { status: 500 });
  }
}

// Update transaction limits
export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 TRANSACTION LIMITS: Updating limits');
    
    const body = await request.json();
    const { limits, updatedBy } = body;
    
    if (!limits) {
      return NextResponse.json({
        success: false,
        error: 'Limits data is required'
      }, { status: 400 });
    }
    
    // Validate the limits
    const validation = validateTransactionLimits(limits);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid limits data',
        details: validation.errors
      }, { status: 400 });
    }
    
    // Prepare updated limits
    const updatedLimits: TransactionLimits = {
      ...limits,
      id: 'current',
      lastUpdated: new Date(),
      updatedBy: updatedBy || 'admin',
      version: (limits.version || 0) + 1
    };
    
    // Save to Firebase
    await adminDb.collection('transactionLimits').doc('current').set(updatedLimits);
    
    console.log('✅ TRANSACTION LIMITS: Successfully updated limits:', updatedLimits);
    
    return NextResponse.json({
      success: true,
      limits: updatedLimits
    });
    
  } catch (error: any) {
    console.error('❌ TRANSACTION LIMITS: Error updating limits:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update transaction limits'
    }, { status: 500 });
  }
}

// Validate transaction limits
function validateTransactionLimits(limits: any): LimitValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  if (!limits.onRamp || !limits.offRamp) {
    errors.push('Both onRamp and offRamp limits are required');
  }
  
  if (limits.onRamp) {
    // Validate on-ramp limits
    if (limits.onRamp.minNairaAmount < 0) {
      errors.push('On-ramp minimum Naira amount must be positive');
    }
    if (limits.onRamp.maxNairaAmount <= limits.onRamp.minNairaAmount) {
      errors.push('On-ramp maximum Naira amount must be greater than minimum');
    }
    if (limits.onRamp.minSuiAmount < 0) {
      errors.push('On-ramp minimum SUI amount must be positive');
    }
    if (limits.onRamp.maxSuiAmount <= limits.onRamp.minSuiAmount) {
      errors.push('On-ramp maximum SUI amount must be greater than minimum');
    }
    if (limits.onRamp.minUsdcAmount < 0) {
      errors.push('On-ramp minimum USDC amount must be positive');
    }
    if (limits.onRamp.maxUsdcAmount <= limits.onRamp.minUsdcAmount) {
      errors.push('On-ramp maximum USDC amount must be greater than minimum');
    }
    if (limits.onRamp.minUsdtAmount < 0) {
      errors.push('On-ramp minimum USDT amount must be positive');
    }
    if (limits.onRamp.maxUsdtAmount <= limits.onRamp.minUsdtAmount) {
      errors.push('On-ramp maximum USDT amount must be greater than minimum');
    }
  }
  
  if (limits.offRamp) {
    // Validate off-ramp limits
    if (limits.offRamp.minNairaAmount < 0) {
      errors.push('Off-ramp minimum Naira amount must be positive');
    }
    if (limits.offRamp.maxNairaAmount <= limits.offRamp.minNairaAmount) {
      errors.push('Off-ramp maximum Naira amount must be greater than minimum');
    }
    if (limits.offRamp.minSuiAmount < 0) {
      errors.push('Off-ramp minimum SUI amount must be positive');
    }
    if (limits.offRamp.maxSuiAmount <= limits.offRamp.minSuiAmount) {
      errors.push('Off-ramp maximum SUI amount must be greater than minimum');
    }
    if (limits.offRamp.minUsdcAmount < 0) {
      errors.push('Off-ramp minimum USDC amount must be positive');
    }
    if (limits.offRamp.maxUsdcAmount <= limits.offRamp.minUsdcAmount) {
      errors.push('Off-ramp maximum USDC amount must be greater than minimum');
    }
    if (limits.offRamp.minUsdtAmount < 0) {
      errors.push('Off-ramp minimum USDT amount must be positive');
    }
    if (limits.offRamp.maxUsdtAmount <= limits.offRamp.minUsdtAmount) {
      errors.push('Off-ramp maximum USDT amount must be greater than minimum');
    }
  }
  
  // Add warnings for very high limits
  if (limits.onRamp?.maxNairaAmount > 5000000) {
    warnings.push('On-ramp maximum Naira amount is very high (>₦5M)');
  }
  if (limits.offRamp?.maxNairaAmount > 5000000) {
    warnings.push('Off-ramp maximum Naira amount is very high (>₦5M)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
