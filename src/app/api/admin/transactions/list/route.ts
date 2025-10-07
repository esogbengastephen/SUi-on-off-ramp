import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TRANSACTION LIST: Fetching transaction list');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchTerm = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // 'all', 'pending', 'completed', 'failed'
    const type = searchParams.get('type') || 'all'; // 'all', 'on_ramp', 'off_ramp'

    let transactionsRef: FirebaseFirestore.Query = adminDb.collection('transactions');

    // Apply search filter
    let queryTransactions: any[] = [];
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const transactionsSnapshot = await transactionsRef.get();
      transactionsSnapshot.forEach(doc => {
        const transactionData = doc.data();
        if (
          doc.id.toLowerCase().includes(lowerCaseSearchTerm) ||
          transactionData.userAddress?.toLowerCase().includes(lowerCaseSearchTerm) ||
          transactionData.suiAmount?.toString().includes(lowerCaseSearchTerm) ||
          transactionData.nairaAmount?.toString().includes(lowerCaseSearchTerm)
        ) {
          queryTransactions.push({ id: doc.id, ...transactionData });
        }
      });
    } else {
      const transactionsSnapshot = await transactionsRef.get();
      transactionsSnapshot.forEach(doc => {
        queryTransactions.push({ id: doc.id, ...doc.data() });
      });
    }

    // Map and convert Timestamps to Date objects
    const transactions = queryTransactions.map(transactionData => ({
      id: transactionData.id,
      type: transactionData.type || 'unknown',
      status: transactionData.status || 'pending',
      userAddress: transactionData.userAddress || 'No address',
      suiAmount: transactionData.suiAmount || 0,
      nairaAmount: transactionData.nairaAmount || 0,
      exchangeRate: transactionData.exchangeRate || 0,
      createdAt: transactionData.createdAt instanceof Timestamp ? transactionData.createdAt.toDate() : new Date(),
      updatedAt: transactionData.updatedAt instanceof Timestamp ? transactionData.updatedAt.toDate() : new Date(),
      transactionHash: transactionData.transactionHash || null,
      paystackReference: transactionData.paystackReference || null,
      bankAccount: transactionData.bankAccount || null,
      bankName: transactionData.bankName || null,
      accountName: transactionData.accountName || null,
      email: transactionData.email || null,
      phone: transactionData.phone || null,
      notes: transactionData.notes || null,
    }));

    // Filter by status if specified
    let filteredTransactions = transactions;
    if (status !== 'all') {
      filteredTransactions = transactions.filter(transaction => 
        transaction.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Filter by type if specified
    if (type !== 'all') {
      filteredTransactions = filteredTransactions.filter(transaction => 
        transaction.type.toLowerCase() === type.toLowerCase()
      );
    }

    // Sort by creation date (newest first)
    filteredTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate pagination info
    const totalTransactions = filteredTransactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalTransactions);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    console.log('✅ TRANSACTION LIST: Successfully fetched transaction list:', {
      totalTransactions,
      returnedTransactions: paginatedTransactions.length,
      page,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          search: searchTerm,
          status: status,
          type: type,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ TRANSACTION LIST: Error fetching transaction list:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transaction list',
      },
      { status: 500 }
    );
  }
}
