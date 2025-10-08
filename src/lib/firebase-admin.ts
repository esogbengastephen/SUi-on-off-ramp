import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin configuration
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Validate Firebase Admin configuration
const validateAdminConfig = () => {
  const requiredKeys = ['projectId', 'clientEmail', 'privateKey'];
  const missingKeys = requiredKeys.filter(key => !firebaseAdminConfig[key as keyof typeof firebaseAdminConfig]);
  
  if (missingKeys.length > 0) {
    console.log('Missing Firebase Admin configuration keys:', missingKeys);
    // During build time, don't throw error - return null instead
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      console.log('Build-time Firebase Admin initialization skipped due to missing config');
      return null;
    }
    throw new Error(`Missing Firebase Admin configuration: ${missingKeys.join(', ')}`);
  }
  return true;
};

// Initialize Firebase Admin only if not already initialized
let adminApp;
try {
  const isValid = validateAdminConfig();
  if (isValid && firebaseAdminConfig.projectId && firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
    adminApp = getApps().length === 0 ? initializeApp({
      credential: cert(firebaseAdminConfig),
      projectId: firebaseAdminConfig.projectId,
    }) : getApps()[0];
  } else {
    adminApp = null;
  }
} catch (error) {
  console.error('Firebase Admin initialization failed:', error);
  // During build time, don't throw error - set app to null instead
  if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
    console.log('Build-time Firebase Admin initialization failed, continuing without Firebase Admin');
    adminApp = null;
  } else {
    throw error;
  }
}

// Initialize Firebase Admin services with error handling
export const adminDb = (() => {
  try {
    if (!adminApp) {
      console.log('Firebase Admin app not initialized, returning null for adminDb');
      return null;
    }
    return getFirestore(adminApp);
  } catch (error) {
    console.error('Firestore Admin initialization failed:', error);
    // During build time, don't throw error - return null instead
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      console.log('Build-time Firestore Admin initialization failed, returning null');
      return null;
    }
    throw error;
  }
})();

export const adminAuth = (() => {
  try {
    if (!adminApp) {
      console.log('Firebase Admin app not initialized, returning null for adminAuth');
      return null;
    }
    return getAuth(adminApp);
  } catch (error) {
    console.error('Auth Admin initialization failed:', error);
    // During build time, don't throw error - return null instead
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      console.log('Build-time Auth Admin initialization failed, returning null');
      return null;
    }
    throw error;
  }
})();

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

export default adminApp;
