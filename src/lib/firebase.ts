import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && {
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  })
};

// Debug: Log Firebase configuration (remove in production)
console.log('🔧 Firebase Config Debug:', {
  apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
  authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
  projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing',
  appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing',
  measurementId: firebaseConfig.measurementId ? '✅ Set' : '⚠️ Optional (not set)'
});

// Validate Firebase configuration
const validateConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.error('Missing Firebase configuration keys:', missingKeys);
    // During build time, don't throw error - return null instead
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      console.log('Build-time Firebase initialization skipped due to missing config');
      return null;
    }
    throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
  }
  return true;
};

// Initialize Firebase only if not already initialized
let app;
try {
  const isValid = validateConfig();
  if (isValid) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } else {
    app = null;
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // During build time, don't throw error - set app to null instead
  if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
    console.log('Build-time Firebase initialization failed, continuing without Firebase');
    app = null;
  } else {
  throw error;
  }
}

// Initialize Firebase services with error handling
export const db = (() => {
  try {
    if (!app) {
      console.log('Firebase app not initialized, returning null for db');
      return null;
    }
    return getFirestore(app);
  } catch (error) {
    console.error('Firestore initialization failed:', error);
    // During build time, don't throw error - return null instead
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      console.log('Build-time Firestore initialization failed, returning null');
      return null;
    }
    throw error;
  }
})();

export const auth = (() => {
  try {
    if (!app) {
      console.log('Firebase app not initialized, returning null for auth');
      return null;
    }
    return getAuth(app);
  } catch (error) {
    console.error('Auth initialization failed:', error);
    // During build time, don't throw error - return null instead
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      console.log('Build-time Auth initialization failed, returning null');
      return null;
    }
    throw error;
  }
})();

// Initialize Analytics only on client side with error handling
export const analytics = (() => {
  if (typeof window === 'undefined') return null;
  try {
    if (!app) {
      console.log('Firebase app not initialized, returning null for analytics');
      return null;
    }
    return isSupported() ? getAnalytics(app) : null;
  } catch (error) {
    console.error('Analytics initialization failed:', error);
    return null;
  }
})();

// Initialize Messaging only on client side with error handling
export const messaging = (() => {
  if (typeof window === 'undefined') return null;
  try {
    if (!app) {
      console.log('Firebase app not initialized, returning null for messaging');
      return null;
    }
    return getMessaging(app);
  } catch (error) {
    console.error('Messaging initialization failed:', error);
    return null;
  }
})();

// Collections constants
export const COLLECTIONS = {
  // Existing Collections
  TRANSACTIONS: 'transactions',
  USERS: 'users',
  PAYMENTS: 'payments',
  AUDIT_LOGS: 'auditLogs',
  SYSTEM_HEALTH: 'systemHealth',
  ADMIN_SETTINGS: 'adminSettings',
  TREASURY_BALANCES: 'treasuryBalances',
  TREASURY_TRANSACTIONS: 'treasuryTransactions',
  
  // Authentication & User Management
  EMAIL_VERIFICATION: 'emailVerification',
  REFERRAL_CODES: 'referralCodes',
  REFERRAL_TREE: 'referralTree',
  USER_ANALYTICS: 'userAnalytics',
  
  // New Admin Collections
  ADMIN_USERS: 'adminUsers',
  ADMIN_SESSIONS: 'adminSessions',
  ADMIN_ACTIVITIES: 'adminActivities',
  TREASURY_SNAPSHOTS: 'treasurySnapshots',
  TREASURY_ALERTS: 'treasuryAlerts',
  TREASURY_OPERATIONS: 'treasuryOperations',
  TRANSACTION_OVERRIDES: 'transactionOverrides',
  BULK_OPERATIONS: 'bulkOperations',
  USER_PROFILES: 'userProfiles',
  USER_ACTIVITIES: 'userActivities',
  DAILY_ANALYTICS: 'dailyAnalytics',
  CUSTOM_REPORTS: 'customReports',
  REPORT_EXECUTIONS: 'reportExecutions',
  SYSTEM_ALERTS: 'systemAlerts',
  NOTIFICATION_TEMPLATES: 'notificationTemplates'
} as const;

export default app;
