#!/bin/bash

# Deploy New Contract Script
# This script helps you deploy a new contract with updated settings

echo "🔄 Deploying New Contract"
echo "========================"

# Check if we're in the right directory
if [ ! -f "Move.toml" ]; then
    echo "❌ Error: Please run this script from the contracts directory"
    echo "   cd contracts && ./deploy-new.sh"
    exit 1
fi

# Get current address
echo "📋 Getting your current wallet address..."
CURRENT_ADDRESS=$(sui client active-address)
if [ -z "$CURRENT_ADDRESS" ]; then
    echo "❌ Error: No active address found. Please configure Sui CLI first."
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
echo "📦 Publishing new contract..."
PUBLISH_OUTPUT=$(sui client publish --gas-budget 100000000 --json)
if [ $? -ne 0 ]; then
    echo "❌ Publish failed. Please check your balance and try again."
    exit 1
fi

# Extract package ID manually (since jq might not be available)
PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | grep -o '"packageId": "[^"]*"' | cut -d'"' -f4)
if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Error: Could not extract package ID from publish output"
    echo "Please check the output above and find the packageId manually"
    exit 1
fi

echo "✅ New contract published!"
echo "📋 New Package ID: $PACKAGE_ID"

# Extract contract object ID
CONTRACT_ID=$(echo "$PUBLISH_OUTPUT" | grep -o '"objectId": "[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Error: Could not extract contract ID from init output"
    echo "Please check the output above and find the SwapContract objectId manually"
    exit 1
fi

echo "✅ Contract initialized!"
echo "📋 New Contract ID: $CONTRACT_ID"

# Backup old .env.local
echo "💾 Backing up old configuration..."
cp ../.env.local ../.env.local.backup

# Create new .env.local file
echo "📝 Creating new environment configuration..."
cat > ../.env.local << EOF
# SUI Contract Configuration (Updated)
NEXT_PUBLIC_SWAP_CONTRACT_ID=$CONTRACT_ID
NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID=$PACKAGE_ID

# Paystack Configuration (replace with your actual key)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
EOF

echo "✅ Environment file updated: ../.env.local"

# Summary
echo ""
echo "🎉 New Contract Deployed!"
echo "========================"
echo "📋 New Package ID: $PACKAGE_ID"
echo "📋 New Contract ID: $CONTRACT_ID"
echo "📋 Your Address: $CURRENT_ADDRESS"
echo ""
echo "🔧 Next Steps:"
echo "1. Update PAYSTACK_SECRET_KEY in ../.env.local"
echo "2. Restart your development server: npm run dev"
echo "3. Test the new contract: http://localhost:3000/swap"
echo "4. Access admin dashboard: http://localhost:3000/admin"
echo ""
echo "⚠️  Important: Save these new IDs for future reference!"
echo "📁 Old configuration backed up to: ../.env.local.backup"
