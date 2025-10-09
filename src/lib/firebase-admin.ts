import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    }),
  });
}

// Export Firebase Admin services
export const adminDb = getFirestore();
export const adminAuth = getAuth();

// Collections constants for server-side
export const ADMIN_COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  USERS: 'users',
  PAYMENTS: 'payments',
  AUDIT_LOGS: 'auditLogs',
  SYSTEM_HEALTH: 'systemHealth',
  ADMIN_SETTINGS: 'adminSettings',
  TREASURY_BALANCES: 'treasuryBalances',
  TREASURY_TRANSACTIONS: 'treasuryTransactions'
} as const;
