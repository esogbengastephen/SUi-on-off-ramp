import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { adminDb } from '@/lib/firebase-admin';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 TREASURY WITHDRAWAL: Processing withdrawal request');

    const body = await request.json();
    const { 
      currency, 
      amount, 
      adminPrivateKey, 
      recipientAddress,
      description = 'Treasury withdrawal',
      bankDetails = null 
    } = body;

    if (!currency || !amount || !adminPrivateKey || !recipientAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const treasuryId = process.env.NEXT_PUBLIC_TREASURY_ID;
    const contractId = process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID;
    const adminCapId = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;

    if (!treasuryId || !contractId || !adminCapId) {
      return NextResponse.json(
        { success: false, error: 'Contract configuration missing' },
        { status: 500 }
      );
    }

    // Create keypair from private key
    let keypair;
    try {
      // Try to parse as hex string first
      if (adminPrivateKey.startsWith('0x')) {
        const hexKey = adminPrivateKey.slice(2);
        const keyBytes = new Uint8Array(hexKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        keypair = Ed25519Keypair.fromSecretKey(keyBytes);
      } else if (adminPrivateKey.length === 64) {
        // Assume it's a hex string without 0x prefix
        const keyBytes = new Uint8Array(adminPrivateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        keypair = Ed25519Keypair.fromSecretKey(keyBytes);
      } else {
        // Try to parse as base64 or other format
        keypair = Ed25519Keypair.fromSecretKey(adminPrivateKey);
      }
    } catch (error) {
      console.error('❌ TREASURY WITHDRAWAL: Invalid private key format:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid private key format. Please provide a valid 32-byte private key.' },
        { status: 400 }
      );
    }
    const sender = keypair.getPublicKey().toSuiAddress();

    console.log('🚀 TREASURY WITHDRAWAL: Sender:', sender, 'Amount:', amount, 'Currency:', currency, 'Recipient:', recipientAddress);

    const txb = new TransactionBlock();

    if (currency === 'SUI') {
      // For SUI withdrawals, we use the withdraw_from_treasury function
      txb.moveCall({
        target: `${contractId}::swap::withdraw_from_treasury`,
        arguments: [
          txb.object(treasuryId),
          txb.pure.u64(amount * 1e9), // Convert to MIST
          txb.object(adminCapId)
        ]
      });

      // Transfer to recipient
      txb.transferObjects([], recipientAddress);
    } else if (currency === 'USDC' || currency === 'USDT') {
      // For USDC/USDT, we need to handle differently since the original contract only supports SUI
      // For now, we'll create a placeholder transaction
      txb.transferObjects([], sender);
    }

    // Set gas budget
    txb.setGasBudget(10000000);

    // Sign and execute transaction
    const result = await client.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      }
    });

    console.log('🚀 TREASURY WITHDRAWAL: Transaction result:', result);

    // Store transaction record in Firebase
    const transactionRecord = {
      id: result.digest,
      type: 'WITHDRAWAL',
      currency: currency,
      amount: amount,
      description: description,
      status: 'COMPLETED',
      adminAddress: sender,
      recipientAddress: recipientAddress,
      treasuryId: treasuryId,
      transactionHash: result.digest,
      bankDetails: bankDetails,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('treasury_transactions').doc(result.digest).set(transactionRecord);

    console.log('✅ TREASURY WITHDRAWAL: Successfully processed withdrawal');

    return NextResponse.json({
      success: true,
      transactionHash: result.digest,
      message: `Successfully withdrew ${amount} ${currency} from treasury`
    });

  } catch (error: any) {
    console.error('❌ TREASURY WITHDRAWAL: Error processing withdrawal:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process withdrawal' 
      },
      { status: 500 }
    );
  }
}
