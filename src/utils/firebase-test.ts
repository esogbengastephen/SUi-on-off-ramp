import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, onSnapshot } from 'firebase/firestore';

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Test Firebase connection
async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Connection...');
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase app initialized successfully');
    console.log('✅ Firestore database connected');
    
    return { success: true, db };
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return { success: false, error };
  }
}

// Test Firestore collections
async function testFirestoreCollections(db) {
  console.log('📊 Testing Firestore Collections...');
  
  const collections = ['transactions', 'users', 'payments', 'auditLogs', 'systemHealth'];
  const results = {};
  
  for (const collectionName of collections) {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      results[collectionName] = {
        success: true,
        count: snapshot.docs.length,
        docs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };
      
      console.log(`✅ Collection '${collectionName}': ${snapshot.docs.length} documents`);
    } catch (error) {
      results[collectionName] = {
        success: false,
        error: error.message
      };
      console.error(`❌ Collection '${collectionName}' failed:`, error.message);
    }
  }
  
  return results;
}

// Test adding a transaction
async function testAddTransaction(db) {
  console.log('➕ Testing Transaction Addition...');
  
  try {
    const testTransaction = {
      txId: `test_${Date.now()}`,
      type: 'ON_RAMP',
      status: 'PENDING',
      userAddress: '0xtest123',
      suiAmount: 1.0,
      nairaAmount: 1500,
      exchangeRate: 1500,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'transactions'), testTransaction);
    console.log('✅ Test transaction added with ID:', docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Failed to add test transaction:', error);
    return { success: false, error };
  }
}

// Test real-time updates
async function testRealTimeUpdates(db) {
  console.log('🔄 Testing Real-time Updates...');
  
  return new Promise((resolve) => {
    const unsubscribe = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        console.log('✅ Real-time update received:', snapshot.docs.length, 'documents');
        unsubscribe();
        resolve({ success: true });
      },
      (error) => {
        console.error('❌ Real-time update failed:', error);
        resolve({ success: false, error });
      }
    );
    
    // Timeout after 5 seconds
    setTimeout(() => {
      unsubscribe();
      resolve({ success: false, error: 'Timeout' });
    }, 5000);
  });
}

// Main test function
async function runFirebaseTests() {
  console.log('🚀 Starting Firebase Integration Tests...\n');
  
  // Test 1: Firebase Connection
  const connectionResult = await testFirebaseConnection();
  if (!connectionResult.success) {
    console.log('❌ Firebase connection failed. Stopping tests.');
    return;
  }
  
  console.log('');
  
  // Test 2: Firestore Collections
  const collectionsResult = await testFirestoreCollections(connectionResult.db);
  
  console.log('');
  
  // Test 3: Add Transaction
  const addResult = await testAddTransaction(connectionResult.db);
  
  console.log('');
  
  // Test 4: Real-time Updates
  const realtimeResult = await testRealTimeUpdates(connectionResult.db);
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  console.log(`Firebase Connection: ${connectionResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Collections Access: ${Object.values(collectionsResult).every(r => r.success) ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Add Transaction: ${addResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Real-time Updates: ${realtimeResult.success ? '✅ PASS' : '❌ FAIL'}`);
  
  const allTestsPassed = connectionResult.success && 
                        Object.values(collectionsResult).every(r => r.success) &&
                        addResult.success && 
                        realtimeResult.success;
  
  console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return {
    connection: connectionResult,
    collections: collectionsResult,
    addTransaction: addResult,
    realtime: realtimeResult,
    allPassed: allTestsPassed
  };
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.runFirebaseTests = runFirebaseTests;
}

export { runFirebaseTests };


