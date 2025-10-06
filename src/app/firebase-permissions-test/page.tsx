"use client";

import { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FirebasePermissionsTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testFirebasePermissions = async () => {
    setIsLoading(true);
    setTestResult('Testing Firebase permissions...');

    try {
      // Test 1: Try to read from transactions collection
      console.log('Testing read permissions...');
      const transactionsRef = collection(db, 'transactions');
      const snapshot = await getDocs(transactionsRef);
      console.log('✅ Read test passed - found', snapshot.docs.length, 'documents');

      // Test 2: Try to write a test document
      console.log('Testing write permissions...');
      const testDoc = await addDoc(collection(db, 'transactions'), {
        test: true,
        timestamp: new Date(),
        message: 'Firebase permissions test document'
      });
      console.log('✅ Write test passed - created document:', testDoc.id);

      setTestResult('✅ SUCCESS: Firebase permissions are working correctly!');
      
    } catch (error) {
      console.error('❌ Firebase permissions test failed:', error);
      setTestResult(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Firebase Permissions Test</h1>
          <p className="text-muted-foreground mt-2">
            Test Firebase Firestore read and write permissions
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Test Firebase Permissions</h2>
          <p className="text-sm text-gray-600">
            This will test if your Firebase Firestore database allows read and write operations.
          </p>
          
          <button
            onClick={testFirebasePermissions}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded"
          >
            {isLoading ? 'Testing...' : 'Test Firebase Permissions'}
          </button>

          {testResult && (
            <div className={`p-4 rounded ${
              testResult.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                testResult.includes('✅') ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult}
              </p>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800">If the test fails:</h3>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• Make sure Firestore database is created in Firebase Console</li>
            <li>• Check that security rules allow read/write access</li>
            <li>• Verify your Firebase project ID is correct</li>
            <li>• Ensure you're logged into the correct Firebase project</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Quick Fix Steps:</h3>
          <ol className="text-sm text-blue-700 mt-2 space-y-1">
            <li>1. Go to <a href="https://console.firebase.google.com/" target="_blank" className="underline">Firebase Console</a></li>
            <li>2. Select your project: <code>sui-off-and-on-ramp</code></li>
            <li>3. Go to Firestore Database → Rules</li>
            <li>4. Replace rules with: <code>allow read, write: if true;</code></li>
            <li>5. Click "Publish"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


