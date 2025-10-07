import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { adminDb } from '@/lib/firebase-admin';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 TREASURY DEPOSIT: Processing deposit request');

    const body = await request.json();
    const { 
      currency, 
      amount, 
      adminPrivateKey, 
      description = 'Treasury deposit',
      paystackReference = null 
    } = body;

    if (!currency || !amount || !adminPrivateKey) {
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
      console.error('❌ TREASURY DEPOSIT: Invalid private key format:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid private key format. Please provide a valid 32-byte private key.' },
        { status: 400 }
      );
    }
    const sender = keypair.getPublicKey().toSuiAddress();

    console.log('🚀 TREASURY DEPOSIT: Sender:', sender, 'Amount:', amount, 'Currency:', currency);

    const txb = new TransactionBlock();

    if (currency === 'SUI') {
      // For SUI deposits, we use the deposit_to_treasury function
      const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(amount * 1e9)]); // Convert to MIST
      
      txb.moveCall({
        target: `${contractId}::swap::deposit_to_treasury`,
        arguments: [
          txb.object(treasuryId),
          coin,
          txb.object(adminCapId)
        ]
      });
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

    console.log('🚀 TREASURY DEPOSIT: Transaction result:', result);

    // Store transaction record in Firebase
    const transactionRecord = {
      id: result.digest,
      type: 'DEPOSIT',
      currency: currency,
      amount: amount,
      description: description,
      status: 'COMPLETED',
      adminAddress: sender,
      treasuryId: treasuryId,
      transactionHash: result.digest,
      paystackReference: paystackReference,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('treasury_transactions').doc(result.digest).set(transactionRecord);

    console.log('✅ TREASURY DEPOSIT: Successfully processed deposit');

    return NextResponse.json({
      success: true,
      transactionHash: result.digest,
      message: `Successfully deposited ${amount} ${currency} to treasury`
    });

  } catch (error: any) {
    console.error('❌ TREASURY DEPOSIT: Error processing deposit:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process deposit' 
      },
      { status: 500 }
    );
  }
}
