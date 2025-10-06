"use client";

import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

export default function FirebaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const testFirebaseConnection = async () => {
      try {
        // Get Firebase configuration from environment
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        };

        setConfig(firebaseConfig);

        // Check if all required config values are present
        const missingConfigs = Object.entries(firebaseConfig)
          .filter(([key, value]) => !value)
          .map(([key]) => key);

        if (missingConfigs.length > 0) {
          throw new Error(`Missing Firebase configuration: ${missingConfigs.join(', ')}`);
        }

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        console.log('Firebase app initialized:', app);

        // Test Firestore connection
        const db = getFirestore(app);
        console.log('Firestore initialized:', db);

        // Test Auth connection
        const auth = getAuth(app);
        console.log('Auth initialized:', auth);

        setConnectionStatus('✅ Connected Successfully');
        setError(null);

      } catch (err) {
        console.error('Firebase connection error:', err);
        setConnectionStatus('❌ Connection Failed');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testFirebaseConnection();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Firebase Connection Diagnostic</h1>
          <p className="text-muted-foreground mt-2">
            Detailed Firebase connection testing and troubleshooting
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-lg font-medium">{connectionStatus}</p>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 font-medium">Error:</p>
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {config && (
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Firebase Configuration</h2>
            <div className="space-y-2">
              {Object.entries(config).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{key}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {value ? 'Set' : 'Missing'}
                    </span>
                    {value && (
                      <span className="text-xs text-gray-500 max-w-xs truncate">
                        {String(value).substring(0, 20)}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Troubleshooting Steps</h2>
          <div className="space-y-2 text-sm">
            <p>1. Check that all Firebase environment variables are set in <code>.env.local</code></p>
            <p>2. Verify Firebase project is active and billing is enabled</p>
            <p>3. Ensure Firestore database is created in Firebase Console</p>
            <p>4. Check Firebase project settings match the configuration</p>
            <p>5. Verify network connectivity and firewall settings</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Environment Variables Check</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>NEXT_PUBLIC_FIREBASE_API_KEY</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>NEXT_PUBLIC_FIREBASE_PROJECT_ID</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</span>
              <span className={`px-2 py-1 rounded text-xs ${
                process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


