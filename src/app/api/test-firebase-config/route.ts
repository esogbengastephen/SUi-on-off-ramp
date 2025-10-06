import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test Firebase Admin SDK configuration
    const { adminDb } = await import('@/lib/firebase-admin');
    
    // Test basic connection
    const testRef = adminDb.collection('test');
    const snapshot = await testRef.limit(1).get();
    
    // Test treasury collections
    const treasuryBalancesRef = adminDb.collection('treasuryBalances');
    const treasuryBalancesSnapshot = await treasuryBalancesRef.limit(1).get();
    
    const treasuryTransactionsRef = adminDb.collection('treasuryTransactions');
    const treasuryTransactionsSnapshot = await treasuryTransactionsRef.limit(1).get();
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK is working correctly!',
      timestamp: new Date().toISOString(),
      tests: {
        basicConnection: '✅ Working',
        treasuryBalances: treasuryBalancesSnapshot.empty ? '✅ Collection accessible (empty)' : '✅ Collection accessible (has data)',
        treasuryTransactions: treasuryTransactionsSnapshot.empty ? '✅ Collection accessible (empty)' : '✅ Collection accessible (has data)'
      },
      environment: {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
        privateKeyStartsWith: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.startsWith('-----BEGIN PRIVATE KEY-----') || false,
        clientEmailFormat: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.includes('@') && process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.includes('.iam.gserviceaccount.com') || false
      },
      recommendations: [
        'If you see this message, Firebase Admin SDK is working!',
        'You can now use the treasury management system with real Firebase data.',
        'Visit /admin and click on the Treasury Management tab to see it in action.'
      ]
    });
    
  } catch (error) {
    console.error('Firebase test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        commonIssues: [
          'Check if FIREBASE_ADMIN_PRIVATE_KEY is the full private key with headers',
          'Verify FIREBASE_ADMIN_CLIENT_EMAIL ends with .iam.gserviceaccount.com',
          'Ensure FIREBASE_ADMIN_PROJECT_ID matches your Firebase project',
          'Make sure Firestore security rules allow access to collections'
        ],
        nextSteps: [
          'Follow the FIREBASE_SETUP_GUIDE.md file',
          'Check your .env.local file format',
          'Restart your development server after changes'
        ]
      },
      environment: {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
        privateKeyStartsWith: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.startsWith('-----BEGIN PRIVATE KEY-----') || false,
        clientEmailFormat: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.includes('@') && process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.includes('.iam.gserviceaccount.com') || false
      }
    }, { status: 500 });
  }
}
