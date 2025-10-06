import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { updateDoc, doc } from 'firebase-admin/firestore';
import { creditTokensServerSide } from '@/hooks/useTokenCrediting';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 TOKEN CREDITING API: Starting token crediting request');
    
    const body = await request.json();
    const { userAddress, tokenAmount, tokenType, transactionId, paymentReference } = body;

    console.log('🚀 TOKEN CREDITING API: Request parameters:', {
      userAddress,
      tokenAmount,
      tokenType,
      transactionId,
      paymentReference
    });

    // Validate required parameters
    if (!userAddress || !tokenAmount || !tokenType || !transactionId || !paymentReference) {
      console.error('❌ TOKEN CREDITING API: Missing required parameters');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: userAddress, tokenAmount, tokenType, transactionId, paymentReference' 
        },
        { status: 400 }
      );
    }

    // Validate token type
    if (!['SUI', 'USDC', 'USDT'].includes(tokenType)) {
      console.error('❌ TOKEN CREDITING API: Invalid token type:', tokenType);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid token type. Must be SUI, USDC, or USDT' 
        },
        { status: 400 }
      );
    }

    // Validate token amount
    if (tokenAmount <= 0) {
      console.error('❌ TOKEN CREDITING API: Invalid token amount:', tokenAmount);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token amount must be greater than 0' 
        },
        { status: 400 }
      );
    }

    console.log('🚀 TOKEN CREDITING API: Parameters validated, proceeding with token crediting');

    // Create token crediting parameters
    const creditingParams = {
      userAddress,
      tokenAmount: Number(tokenAmount),
      tokenType: tokenType as 'SUI' | 'USDC' | 'USDT',
      transactionId,
      paymentReference
    };

    // Use the server-side token crediting function
    console.log('🚀 TOKEN CREDITING API: Using server-side token crediting function');

    try {
      // Create token crediting parameters
      const creditingParams = {
        userAddress,
        tokenAmount: Number(tokenAmount),
        tokenType: tokenType as 'SUI' | 'USDC' | 'USDT',
        transactionId,
        paymentReference
      };

      // Call the server-side token crediting function
      const creditingResult = await creditTokensServerSide(creditingParams);

      if (creditingResult.success) {
        console.log('✅ TOKEN CREDITING API: Token crediting completed successfully');
        console.log('✅ TOKEN CREDITING API: Result:', creditingResult);
        
        // Update transaction status in Firebase
        const transactionRef = doc(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS, transactionId);
        await updateDoc(transactionRef, {
          status: 'COMPLETED',
          tokenCreditingHash: creditingResult.transactionHash,
          tokenAmount: Number(tokenAmount),
          tokenType,
          creditedAt: new Date(),
          updatedAt: new Date()
        });

        // Create audit log
        const auditLogsRef = adminDb.collection(ADMIN_COLLECTIONS.AUDIT_LOGS);
        await auditLogsRef.add({
          adminAddress: 'system',
          action: 'token_crediting_completed',
          details: {
            transactionId,
            userAddress,
            tokenAmount: Number(tokenAmount),
            tokenType,
            transactionHash: creditingResult.transactionHash,
            paymentReference
          },
          ipAddress: 'api',
          userAgent: 'token-crediting-api',
          createdAt: new Date()
        });

        return NextResponse.json({
          success: true,
          transactionHash: creditingResult.transactionHash,
          tokenAmount: Number(tokenAmount),
          tokenType,
          message: `${tokenAmount} ${tokenType} credited successfully to ${userAddress}`
        });

      } else {
        console.error('❌ TOKEN CREDITING API: Token crediting failed:', creditingResult.error);
        
        // Update transaction status to failed
        const transactionRef = doc(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS, transactionId);
        await updateDoc(transactionRef, {
          status: 'FAILED',
          error: creditingResult.error || 'Token crediting failed',
          failedAt: new Date(),
          updatedAt: new Date()
        });

        // Create audit log for failure
        const auditLogsRef = adminDb.collection(ADMIN_COLLECTIONS.AUDIT_LOGS);
        await auditLogsRef.add({
          adminAddress: 'system',
          action: 'token_crediting_failed',
          details: {
            transactionId,
            userAddress,
            tokenAmount: Number(tokenAmount),
            tokenType,
            error: creditingResult.error,
            paymentReference
          },
          ipAddress: 'api',
          userAgent: 'token-crediting-api',
          createdAt: new Date()
        });

        return NextResponse.json(
          { 
            success: false, 
            error: creditingResult.error || 'Token crediting failed' 
          },
          { status: 500 }
        );
      }

    } catch (creditingError: any) {
      console.error('❌ TOKEN CREDITING API: Error during token crediting:', creditingError);
      
      // Update transaction status to failed
      const transactionRef = doc(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS, transactionId);
      await updateDoc(transactionRef, {
        status: 'FAILED',
        error: creditingError.message || 'Token crediting failed',
        failedAt: new Date(),
        updatedAt: new Date()
      });

      // Create audit log for failure
      const auditLogsRef = adminDb.collection(ADMIN_COLLECTIONS.AUDIT_LOGS);
      await auditLogsRef.add({
        adminAddress: 'system',
        action: 'token_crediting_failed',
        details: {
          transactionId,
          userAddress,
          tokenAmount: Number(tokenAmount),
          tokenType,
          error: creditingError.message,
          paymentReference
        },
        ipAddress: 'api',
        userAgent: 'token-crediting-api',
        createdAt: new Date()
      });

      return NextResponse.json(
        { 
          success: false, 
          error: creditingError.message || 'Token crediting failed' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ TOKEN CREDITING API: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'token-crediting-api',
    timestamp: new Date().toISOString()
  });
}
