"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function TestFirebasePage() {
  const [authState, setAuthState] = useState<string>('Loading...');
  const [dbState, setDbState] = useState<string>('Loading...');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Test Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState(`✅ Auth working - User: ${user.email}`);
      } else {
        setAuthState('✅ Auth working - No user logged in');
      }
    }, (error) => {
      setAuthState(`❌ Auth error: ${error.message}`);
    });

    // Test Firebase Firestore
    const testDb = async () => {
      try {
        // Try to read a document (this will fail if db is not configured)
        await getDoc(doc(db, 'test', 'test'));
        setDbState('✅ Firestore working');
      } catch (error: any) {
        setDbState(`❌ Firestore error: ${error.message}`);
      }
    };

    testDb();

    // Check Firebase config
    setConfig({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Configuration Test</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2">
              <div>API Key: {config?.apiKey}</div>
              <div>Auth Domain: {config?.authDomain}</div>
              <div>Project ID: {config?.projectId}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Firebase Auth</h2>
            <div>{authState}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibent mb-4">Firebase Firestore</h2>
            <div>{dbState}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <a href="/auth" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Go to Auth Page
              </a>
              <a href="/" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
