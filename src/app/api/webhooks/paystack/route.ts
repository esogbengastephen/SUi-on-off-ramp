import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { addDoc, collection, updateDoc, doc, query, where, getDocs } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { checkTreasuryBalance } from '@/app/api/admin/treasury/balance/route';

// Paystack webhook secret from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

interface PaystackWebhookData {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      custom_fields: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
      referrer: string;
    };
    log: {
      time_spent: number;
      attempts: number;
      authentication: string;
      errors: number;
      success: boolean;
      mobile: boolean;
      input: any[];
      channel: string;
      history: Array<{
        type: string;
        message: string;
        time: number;
      }>;
    };
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
      international_format_phone: string;
    };
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

// Verify Paystack webhook signature
function verifyPaystackSignature(payload: string, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('Paystack secret key not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload, 'utf8')
    .digest('hex');

  return hash === signature;
}

// Find transaction by payment reference
async function findTransactionByReference(reference: string) {
  try {
    const transactionsRef = collection(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS);
    const q = query(transactionsRef, where('paymentReference', '==', reference));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error finding transaction by reference:', error);
    return null;
  }
}

// Update transaction status
async function updateTransactionStatus(transactionId: string, status: string, paymentData: any) {
  try {
    const transactionRef = doc(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS, transactionId);
    await updateDoc(transactionRef, {
      status,
      updatedAt: new Date(),
      paymentData: {
        paystackReference: paymentData.reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paidAt: paymentData.paid_at,
        gatewayResponse: paymentData.gateway_response,
        ...paymentData
      }
    });
    
    console.log(`Transaction ${transactionId} updated to status: ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
}

// Create payment record
async function createPaymentRecord(transactionId: string, paymentData: any) {
  try {
    const paymentsRef = collection(adminDb, ADMIN_COLLECTIONS.PAYMENTS);
    await addDoc(paymentsRef, {
      transactionId,
      paystackReference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: paymentData.status,
      webhookData: paymentData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Payment record created for transaction ${transactionId}`);
    return true;
  } catch (error) {
    console.error('Error creating payment record:', error);
    return false;
  }
}

// Create audit log
async function createAuditLog(action: string, details: any) {
  try {
    const auditLogsRef = collection(adminDb, ADMIN_COLLECTIONS.AUDIT_LOGS);
    await addDoc(auditLogsRef, {
      adminAddress: 'system',
      action,
      details,
      ipAddress: 'webhook',
      userAgent: 'paystack-webhook',
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('Missing Paystack signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifyPaystackSignature(body, signature)) {
      console.error('Invalid Paystack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const webhookData: PaystackWebhookData = JSON.parse(body);
    const { event, data } = webhookData;

    console.log(`Received Paystack webhook: ${event}`, {
      reference: data.reference,
      status: data.status,
      amount: data.amount
    });

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        await handleSuccessfulPayment(data);
        break;
      
      case 'charge.failed':
        await handleFailedPayment(data);
        break;
      
      case 'charge.dispute.create':
        await handleDisputeCreated(data);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Create audit log for webhook
    await createAuditLog('paystack_webhook_received', {
      event,
      reference: data.reference,
      status: data.status,
      amount: data.amount
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(paymentData: any) {
  try {
    console.log('🚀 WEBHOOK: Starting successful payment handling');
    console.log('🚀 WEBHOOK: Payment data:', {
      reference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency
    });

    const transaction = await findTransactionByReference(paymentData.reference);
    
    if (!transaction) {
      console.error(`Transaction not found for reference: ${paymentData.reference}`);
      return;
    }

    console.log('🚀 WEBHOOK: Found transaction:', transaction.id);

    // Update transaction status to confirmed
    await updateTransactionStatus(transaction.id, 'CONFIRMED', paymentData);
    
    // Create payment record
    await createPaymentRecord(transaction.id, paymentData);
    
    console.log(`Payment confirmed for transaction ${transaction.id}`);
    
    // Create audit log
    await createAuditLog('payment_confirmed', {
      transactionId: transaction.id,
      reference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency
    });

    // ENHANCED: Automated Token Crediting
    console.log('🚀 WEBHOOK: Starting automated token crediting process');
    
    try {
      // Check if this is an ON-RAMP transaction
      if (transaction.type === 'ON_RAMP') {
        console.log('🚀 WEBHOOK: ON-RAMP transaction detected, proceeding with token crediting');
        
        // Determine token type and amount from transaction data
        const tokenType = transaction.verificationData?.tokenType || 'SUI';
        const tokenAmount = transaction.suiAmount || 0;
        
        console.log('🚀 WEBHOOK: Token crediting parameters:', {
          userAddress: transaction.userAddress,
          tokenAmount,
          tokenType,
          transactionId: transaction.id,
          paymentReference: paymentData.reference
        });

        // Check treasury balance before crediting
        console.log('🚀 WEBHOOK: Checking treasury balance before crediting');
        const hasSufficientBalance = await checkTreasuryBalance(tokenType, tokenAmount);
        
        if (!hasSufficientBalance) {
          console.error('❌ WEBHOOK: Insufficient treasury balance for token crediting');
          
          // Update transaction status to failed due to insufficient treasury
          await updateTransactionStatus(transaction.id, 'FAILED', {
            ...paymentData,
            error: 'Insufficient treasury balance for token crediting',
            failedAt: new Date().toISOString()
          });
          
          // Create audit log for insufficient balance
          await createAuditLog('token_crediting_failed_insufficient_balance', {
            transactionId: transaction.id,
            tokenType,
            tokenAmount,
            reference: paymentData.reference
          });
          
          return;
        }

        console.log('✅ WEBHOOK: Treasury balance sufficient, proceeding with token crediting');

        // Call the token crediting API endpoint
        const creditingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/credit-tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: transaction.userAddress,
            tokenAmount,
            tokenType,
            transactionId: transaction.id,
            paymentReference: paymentData.reference
          })
        });

        const creditingResult = await creditingResponse.json();

        if (creditingResult.success) {
          console.log('✅ WEBHOOK: Token crediting completed successfully');
          console.log('✅ WEBHOOK: Crediting result:', creditingResult);
          
          // Update transaction status to completed
          await updateTransactionStatus(transaction.id, 'COMPLETED', {
            ...paymentData,
            tokenCreditingHash: creditingResult.transactionHash,
            tokenAmount,
            tokenType,
            creditedAt: new Date().toISOString()
          });
          
          // Create audit log for successful crediting
          await createAuditLog('token_crediting_successful', {
            transactionId: transaction.id,
            tokenType,
            tokenAmount,
            transactionHash: creditingResult.transactionHash,
            reference: paymentData.reference
          });
          
        } else {
          console.error('❌ WEBHOOK: Token crediting failed:', creditingResult.error);
          
          // Update transaction status to failed
          await updateTransactionStatus(transaction.id, 'FAILED', {
            ...paymentData,
            error: creditingResult.error || 'Token crediting failed',
            failedAt: new Date().toISOString()
          });
          
          // Create audit log for failed crediting
          await createAuditLog('token_crediting_failed', {
            transactionId: transaction.id,
            tokenType,
            tokenAmount,
            error: creditingResult.error,
            reference: paymentData.reference
          });
        }
        
      } else {
        console.log('🚀 WEBHOOK: Non-ON-RAMP transaction, skipping token crediting');
      }
      
    } catch (creditingError) {
      console.error('❌ WEBHOOK: Error during token crediting process:', creditingError);
      
      // Update transaction status to failed
      await updateTransactionStatus(transaction.id, 'FAILED', {
        ...paymentData,
        error: creditingError.message || 'Token crediting process failed',
        failedAt: new Date().toISOString()
      });
      
      // Create audit log for crediting error
      await createAuditLog('token_crediting_error', {
        transactionId: transaction.id,
        error: creditingError.message,
        reference: paymentData.reference
      });
    }

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(paymentData: any) {
  try {
    const transaction = await findTransactionByReference(paymentData.reference);
    
    if (!transaction) {
      console.error(`Transaction not found for reference: ${paymentData.reference}`);
      return;
    }

    // Update transaction status to failed
    await updateTransactionStatus(transaction.id, 'FAILED', paymentData);
    
    // Create payment record
    await createPaymentRecord(transaction.id, paymentData);
    
    console.log(`Payment failed for transaction ${transaction.id}`);
    
    // Create audit log
    await createAuditLog('payment_failed', {
      transactionId: transaction.id,
      reference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      reason: paymentData.gateway_response
    });

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

async function handleDisputeCreated(disputeData: any) {
  try {
    console.log(`Dispute created for reference: ${disputeData.reference}`);
    
    // Create audit log for dispute
    await createAuditLog('dispute_created', {
      reference: disputeData.reference,
      disputeId: disputeData.id,
      amount: disputeData.amount,
      currency: disputeData.currency,
      reason: disputeData.reason
    });

  } catch (error) {
    console.error('Error handling dispute:', error);
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'paystack-webhook',
    timestamp: new Date().toISOString()
  });
}
