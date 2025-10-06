#!/bin/bash

# OFF-RAMP Fix Script
# This script helps fix the packageID issue and deploy the contract properly

echo "🔧 OFF-RAMP Fix Script"
echo "======================"

# Check if we're in the right directory
if [ ! -d "contracts" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Error: Sui CLI is not installed"
    echo "Please install it from: https://docs.sui.io/build/install"
    exit 1
fi

# Check if user has testnet tokens
echo "🔍 Checking wallet balance..."
CURRENT_ADDRESS=$(sui client active-address)
if [ -z "$CURRENT_ADDRESS" ]; then
    echo "❌ Error: No active wallet address found"
    echo "Please run: sui client new-address ed25519"
    exit 1
fi

echo "📍 Current address: $CURRENT_ADDRESS"

# Check balance
BALANCE=$(sui client balance)
echo "💰 Current balance: $BALANCE"

if [[ $BALANCE == *"0 SUI"* ]]; then
    echo "⚠️  Warning: You have 0 SUI. Please get test tokens from: https://faucet.sui.io/"
    echo "   Address: $CURRENT_ADDRESS"
    read -p "Press Enter after getting test tokens..."
fi

# Navigate to contracts directory
cd contracts

# Build the contract
echo "🔨 Building contract..."
sui move build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Publish the contract
echo "📦 Publishing contract..."
PUBLISH_OUTPUT=$(sui client publish --gas-budget 100000000 --json)
if [ $? -ne 0 ]; then
    echo "❌ Publish failed"
    exit 1
fi

# Extract package ID
PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Error: Could not extract package ID"
    echo "Publish output: $PUBLISH_OUTPUT"
    exit 1
fi

echo "✅ Contract published!"
echo "📋 Package ID: $PACKAGE_ID"

# Initialize contract
echo "🔧 Initializing contract..."
INIT_OUTPUT=$(sui client call \
  --package "$PACKAGE_ID" \
  --module sui_naira_swap \
  --function init \
  --args "$CURRENT_ADDRESS" "$CURRENT_ADDRESS" \
  --gas-budget 10000000 \
  --json)

if [ $? -ne 0 ]; then
    echo "❌ Initialization failed."
    echo "Init output: $INIT_OUTPUT"
    exit 1
fi

# Extract contract object ID
CONTRACT_ID=$(echo "$INIT_OUTPUT" | jq -r '.objectChanges[] | select(.type == "created" and .objectType | contains("SwapContract")) | .objectId')
if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Error: Could not extract contract ID from init output"
    echo "Init output: $INIT_OUTPUT"
    exit 1
fi

echo "✅ Contract initialized!"
echo "📋 Contract ID: $CONTRACT_ID"

# Go back to project root
cd ..

# Create .env.local file
echo "📝 Creating environment configuration..."
cat > .env.local << EOF
# SUI Contract Configuration
NEXT_PUBLIC_SWAP_CONTRACT_ID=$CONTRACT_ID
NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID=$PACKAGE_ID

# Paystack Configuration (replace with your actual key)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here

# Firebase Configuration (replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email

# SUI RPC Configuration
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
EOF

echo "✅ Environment file created: .env.local"

# Summary
echo ""
echo "🎉 OFF-RAMP Fix Complete!"
echo "========================"
echo "📋 Package ID: $PACKAGE_ID"
echo "📋 Contract ID: $CONTRACT_ID"
echo "📋 Your Address: $CURRENT_ADDRESS"
echo ""
echo "🔧 Next Steps:"
echo "1. Update PAYSTACK_SECRET_KEY in .env.local"
echo "2. Update Firebase configuration in .env.local"
echo "3. Restart your development server: npm run dev"
echo "4. Test OFF-RAMP with wallet validation: http://localhost:3000/swap"
echo ""
echo "⚠️  Important: Save these IDs for future reference!"
echo "📁 Configuration saved to: .env.local"
echo ""
echo "🚀 The wallet validation system is now ready to prevent failed transactions!"
