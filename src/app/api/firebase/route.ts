import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, limit } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limitParam = searchParams.get('limit');

    switch (action) {
      case 'transactions':
        const transactionsQuery = query(
          collection(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS),
          orderBy('createdAt', 'desc'),
          limit(limitParam ? parseInt(limitParam) : 100)
        );
        
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactions = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));

        return NextResponse.json({ transactions });

      case 'analytics':
        const allTransactionsQuery = query(collection(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS));
        const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
        const allTransactions = allTransactionsSnapshot.docs.map(doc => doc.data());

        const analytics = {
          totalTransactions: allTransactions.length,
          totalVolume: allTransactions.reduce((sum, tx) => sum + (tx.nairaAmount || 0), 0),
          totalRevenue: allTransactions
            .filter(tx => tx.status === 'COMPLETED')
            .reduce((sum, tx) => sum + (tx.nairaAmount * 0.01), 0),
          pendingTransactions: allTransactions.filter(tx => tx.status === 'PENDING').length,
          completedTransactions: allTransactions.filter(tx => tx.status === 'COMPLETED').length,
          failedTransactions: allTransactions.filter(tx => tx.status === 'FAILED').length,
          onRampTransactions: allTransactions.filter(tx => tx.type === 'ON_RAMP').length,
          offRampTransactions: allTransactions.filter(tx => tx.type === 'OFF_RAMP').length
        };

        return NextResponse.json({ analytics });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Firebase API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'addTransaction':
        const transactionRef = await addDoc(collection(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS), {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        return NextResponse.json({ 
          success: true, 
          id: transactionRef.id 
        });

      case 'updateTransaction':
        const { id, updates } = data;
        await updateDoc(doc(adminDb, ADMIN_COLLECTIONS.TRANSACTIONS, id), {
          ...updates,
          updatedAt: new Date()
        });
        
        return NextResponse.json({ success: true });

      case 'addAuditLog':
        await addDoc(collection(adminDb, ADMIN_COLLECTIONS.AUDIT_LOGS), {
          ...data,
          createdAt: new Date()
        });
        
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Firebase API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
