"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function DebugFirebasePage() {
  const [status, setStatus] = useState('Testing Firebase...');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const testFirebase = async () => {
      try {
        // Check Firebase config
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        setConfig(firebaseConfig);

        // Test Firebase Auth
        console.log('🔧 Testing Firebase Auth initialization...');
        console.log('🔧 Auth object:', auth);
        console.log('🔧 Auth app:', auth.app);
        console.log('🔧 Auth config:', auth.config);

        // Try to create a test user (this will fail but give us more info)
        try {
          await createUserWithEmailAndPassword(auth, 'test@test.com', 'password123');
        } catch (error: any) {
          console.log('🔧 Expected auth error (for debugging):', error.code, error.message);
          
          if (error.code === 'auth/configuration-not-found') {
            setStatus('❌ Firebase Auth not configured properly');
          } else if (error.code === 'auth/email-already-in-use') {
            setStatus('✅ Firebase Auth working (email already exists)');
          } else if (error.code === 'auth/weak-password') {
            setStatus('✅ Firebase Auth working (weak password)');
          } else {
            setStatus(`⚠️ Firebase Auth error: ${error.code}`);
          }
        }

      } catch (error: any) {
        console.error('🔧 Firebase test error:', error);
        setStatus(`❌ Firebase error: ${error.message}`);
      }
    };

    testFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Debug Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="text-lg">{status}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 font-mono text-sm">
              <div>API Key: {config?.apiKey ? `${config.apiKey.substring(0, 20)}...` : '❌ Missing'}</div>
              <div>Auth Domain: {config?.authDomain || '❌ Missing'}</div>
              <div>Project ID: {config?.projectId || '❌ Missing'}</div>
              <div>Storage Bucket: {config?.storageBucket || '❌ Missing'}</div>
              <div>Messaging Sender ID: {config?.messagingSenderId || '❌ Missing'}</div>
              <div>App ID: {config?.appId ? `${config.appId.substring(0, 30)}...` : '❌ Missing'}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Possible Solutions</h2>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-yellow-800">If you see "auth/configuration-not-found":</h3>
                <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
                  <li>Firebase Authentication is not enabled in your Firebase project</li>
                  <li>Go to Firebase Console → Authentication → Get Started</li>
                  <li>Enable Email/Password authentication</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-semibold text-blue-800">Alternative: Use Firebase Emulator</h3>
                <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
                  <li>Run: <code className="bg-blue-100 px-1 rounded">firebase emulators:start --only auth</code></li>
                  <li>This allows testing without a real Firebase project</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800">Quick Test</h3>
                <p className="text-green-700 mt-2">
                  Open browser console (F12) to see detailed Firebase debug information
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <a href="/auth" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Try Auth Page
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
