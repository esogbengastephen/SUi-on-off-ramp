#!/bin/bash

# SUI Naira Swap Contract Deployment Script
# This script helps you deploy the contract with your wallet address

echo "🚀 SUI Naira Swap Contract Deployment"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "Move.toml" ]; then
    echo "❌ Error: Please run this script from the contracts directory"
    echo "   cd contracts && ./deploy.sh"
    exit 1
fi

# Get current address
echo "📋 Getting your current wallet address..."
CURRENT_ADDRESS=$(sui client active-address)
if [ -z "$CURRENT_ADDRESS" ]; then
    echo "❌ Error: No active address found. Please configure Sui CLI first."
    echo "   Run: sui client new-address ed25519"
    exit 1
fi

echo "✅ Current address: $CURRENT_ADDRESS"

# Check balance
echo "💰 Checking SUI balance..."
BALANCE=$(sui client gas | grep -o '[0-9]*' | head -1)
if [ -z "$BALANCE" ] || [ "$BALANCE" -lt 100000000 ]; then
    echo "⚠️  Warning: Low SUI balance. You may need more tokens for deployment."
    echo "   Visit: https://faucet.sui.io/"
    echo "   Address: $CURRENT_ADDRESS"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build contract
echo "🔨 Building contract..."
sui move build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Publish contract
echo "📦 Publishing contract..."
PUBLISH_OUTPUT=$(sui client publish --gas-budget 100000000 --json)
if [ $? -ne 0 ]; then
    echo "❌ Publish failed. Please check your balance and try again."
    exit 1
fi

# Extract package ID
PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Error: Could not extract package ID from publish output"
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

# Create .env.local file
echo "📝 Creating environment configuration..."
cat > ../.env.local << EOF
# SUI Contract Configuration
NEXT_PUBLIC_SWAP_CONTRACT_ID=$CONTRACT_ID
NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID=$PACKAGE_ID

# Paystack Configuration (replace with your actual key)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
EOF

echo "✅ Environment file created: ../.env.local"

# Summary
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "📋 Package ID: $PACKAGE_ID"
echo "📋 Contract ID: $CONTRACT_ID"
echo "📋 Your Address: $CURRENT_ADDRESS"
echo ""
echo "🔧 Next Steps:"
echo "1. Update PAYSTACK_SECRET_KEY in ../.env.local"
echo "2. Restart your development server: npm run dev"
echo "3. Test wallet connection: http://localhost:3000/wallet-test"
echo "4. Test swap functionality: http://localhost:3000/swap"
echo "5. Access admin dashboard: http://localhost:3000/admin"
echo ""
echo "⚠️  Important: Save these IDs for future reference!"
