import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 USER LIST: Fetching user list');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build query
    let query = adminDb.collection('users');
    
    // Apply search filter if provided
    if (search) {
      // Note: Firestore doesn't support full-text search natively
      // This is a simplified implementation - in production, consider using Algolia or similar
      query = query.where('email', '>=', search).where('email', '<=', search + '\uf8ff');
    }
    
    // Get total count for pagination
    const totalSnapshot = await query.get();
    const totalUsers = totalSnapshot.size;
    
    // Apply pagination and get users
    const usersSnapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();
    
    const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        id: doc.id,
        email: userData.email || 'No email',
        walletAddress: userData.walletAddress || 'No wallet',
        isEmailVerified: userData.isEmailVerified || userData.emailVerified || false,
        role: userData.role || 'user',
        lastLoginAt: userData.lastLoginAt?.toDate() || null,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        // Additional fields
        phone: userData.phone || null,
        referralCode: userData.referralCode || null,
        totalReferrals: userData.totalReferrals || 0,
        signupSource: userData.signupSource || 'unknown'
      };
    });
    
    // Filter by status if specified
    let filteredUsers = users;
    if (status !== 'all') {
      filteredUsers = users.filter(user => {
        switch (status) {
          case 'verified':
            return user.isEmailVerified;
          case 'pending':
            return !user.isEmailVerified;
          case 'active':
            const sevenDaysAgoActive = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return user.lastLoginAt && user.lastLoginAt > sevenDaysAgoActive;
          case 'inactive':
            const sevenDaysAgoInactive = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return !user.lastLoginAt || user.lastLoginAt <= sevenDaysAgoInactive;
          default:
            return true;
        }
      });
    }
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const result = {
      users: filteredUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search,
        status
      },
      lastUpdated: new Date().toISOString()
    };
    
    console.log('✅ USER LIST: Successfully fetched user list:', {
      totalUsers: result.pagination.totalUsers,
      returnedUsers: filteredUsers.length,
      page: result.pagination.currentPage
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('❌ USER LIST: Error fetching user list:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch user list'
    }, { status: 500 });
  }
}
