import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { adminKey } = await request.json();
    
    // Simple admin key check (in production, use proper authentication)
    if (adminKey !== 'switcherfi-admin-2025') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create the example referral code "111806" for user ID "9528053"
    const exampleUserId = '9528053';
    const exampleReferralCode = '111806';
    
    // Check if referral code already exists
    const existingReferral = await getDoc(doc(db, COLLECTIONS.REFERRAL_CODES, exampleReferralCode));
    
    if (existingReferral.exists()) {
      return NextResponse.json({
        message: 'Referral code already exists',
        referralCode: exampleReferralCode,
        userId: exampleUserId
      });
    }

    // Create the referral code entry
    await setDoc(doc(db, COLLECTIONS.REFERRAL_CODES, exampleReferralCode), {
      userId: exampleUserId,
      code: exampleReferralCode,
      createdAt: new Date(),
      isActive: true,
      totalReferrals: 0,
      isExample: true // Mark as example code
    });

    // Create a mock user profile for the referrer
    await setDoc(doc(db, COLLECTIONS.USERS, exampleUserId), {
      uid: exampleUserId,
      email: 'admin@switcherfi.com',
      role: 'admin',
      kycStatus: 'VERIFIED',
      isEmailVerified: true,
      referralCode: exampleReferralCode,
      totalReferrals: 0,
      signupSource: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      isExample: true // Mark as example user
    });

    console.log(`✅ Initialized example referral code: ${exampleReferralCode} for user: ${exampleUserId}`);

    return NextResponse.json({
      success: true,
      message: 'Example referral code initialized successfully',
      referralCode: exampleReferralCode,
      userId: exampleUserId
    });

  } catch (error) {
    console.error('Referral initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize referral code' },
      { status: 500 }
    );
  }
}
