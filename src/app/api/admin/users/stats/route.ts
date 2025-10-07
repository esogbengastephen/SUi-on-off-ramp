import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 USER STATS: Fetching user statistics');
    
    // Get all users from Firebase
    const usersSnapshot = await adminDb.collection('users').get();
    
    let totalUsers = 0;
    let activeUsers = 0;
    let verifiedUsers = 0;
    let pendingUsers = 0;
    let emailVerifiedUsers = 0;
    let unverifiedUsers = 0;
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      totalUsers++;
      
      // Check email verification only
      const isEmailVerified = userData.isEmailVerified || userData.emailVerified;
      
      // Count verification types
      if (isEmailVerified) {
        emailVerifiedUsers++;
        verifiedUsers++;
      } else {
        pendingUsers++;
        unverifiedUsers++;
      }
      
      // Consider user active if they have recent activity (last 7 days)
      const lastActivity = userData.lastLoginAt?.toDate();
      if (lastActivity && (Date.now() - lastActivity.getTime()) < 7 * 24 * 60 * 60 * 1000) {
        activeUsers++;
      }
    });
    
    const stats = {
      totalUsers,
      activeUsers,
      verifiedUsers,
      pendingUsers,
      emailVerifiedUsers,
      unverifiedUsers,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('✅ USER STATS: Successfully fetched user statistics:', stats);
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error: any) {
    console.error('❌ USER STATS: Error fetching user statistics:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch user statistics'
    }, { status: 500 });
  }
}
