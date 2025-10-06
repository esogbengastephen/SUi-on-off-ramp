# Firebase Setup Guide

## Step 1: Get Firebase Client Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sui-off-and-on-ramp`
3. Click on the gear icon ⚙️ → Project Settings
4. Scroll down to "Your apps" section
5. If you don't have a web app, click "Add app" → Web app
6. Copy the config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "sui-off-and-on-ramp.firebaseapp.com",
  projectId: "sui-off-and-on-ramp",
  storageBucket: "sui-off-and-on-ramp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 2: Get Firebase Admin SDK Service Account Key

1. In Firebase Console, go to Project Settings
2. Click on "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Open the JSON file and copy the values:

```json
{
  "type": "service_account",
  "project_id": "sui-off-and-on-ramp",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfXWVxiKt3ntYx...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@sui-off-and-on-ramp.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Step 3: Update Your .env.local File

Replace the content of your `.env.local` file with:

```bash
# Firebase Client Configuration (from Step 1)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sui-off-and-on-ramp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sui-off-and-on-ramp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sui-off-and-on-ramp.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin SDK Configuration (from Step 2)
FIREBASE_ADMIN_PROJECT_ID=sui-off-and-on-ramp
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfXWVxiKt3ntYx...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@sui-off-and-on-ramp.iam.gserviceaccount.com

# Your existing SUI contract configuration
NEXT_PUBLIC_SWAP_CONTRACT_ID=your_swap_contract_id
NEXT_PUBLIC_TREASURY_ID=your_treasury_id
NEXT_PUBLIC_ADMIN_CAP_ID=your_admin_cap_id
```

## Step 4: Set Up Firestore Security Rules

1. In Firebase Console, go to Firestore Database
2. Click on "Rules" tab
3. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow admin access to treasury collections
    match /treasuryBalances/{document} {
      allow read, write: if true; // Temporarily allow all access
    }
    
    match /treasuryTransactions/{document} {
      allow read, write: if true; // Temporarily allow all access
    }
    
    // Allow access to other collections
    match /transactions/{document} {
      allow read, write: if true; // Temporarily allow all access
    }
    
    match /payments/{document} {
      allow read, write: if true; // Temporarily allow all access
    }
    
    match /auditLogs/{document} {
      allow read, write: if true; // Temporarily allow all access
    }
    
    match /systemHealth/{document} {
      allow read, write: if true; // Temporarily allow all access
    }
  }
}
```

## Step 5: Test the Configuration

After updating your `.env.local` file:

1. Restart your development server:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. Test the Firebase connection:
   ```bash
   curl http://localhost:3002/api/admin/treasury?action=all
   ```

3. Check the admin dashboard:
   - Go to http://localhost:3002/admin
   - Click on "Treasury Management" tab
   - You should see real-time data instead of mock data

## Troubleshooting

### If you still get "Missing or insufficient permissions":

1. **Check the private key format**: Make sure it includes the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
2. **Check the client email**: Should be `firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com`
3. **Verify project ID**: Should match exactly in both client and admin configs
4. **Check Firestore rules**: Make sure they allow access to the collections

### If you get "Firebase is not connected":

1. **Check environment variables**: Make sure all `NEXT_PUBLIC_` variables are set
2. **Restart the server**: After changing `.env.local`, always restart
3. **Check browser console**: Look for any Firebase initialization errors

## Important Notes

- The private key should be the FULL key from the JSON file, including the header and footer
- Make sure there are no extra spaces or characters in your `.env.local` file
- The service account email should end with `.iam.gserviceaccount.com`
- All environment variables should be on separate lines without spaces around the `=`
