#!/bin/bash

# Multi-Token Swap Contract Deployment Script
# This script deploys the multi-token swap contract to Sui testnet

set -e

echo "🚀 Deploying Multi-Token Swap Contract to Sui Testnet..."

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI not found. Please install it first:"
    echo "   curl -fLJO https://github.com/MystenLabs/sui/releases/download/testnet-v1.18.0/sui-testnet-v1.18.0-macos-x86_64.tgz"
    echo "   tar -xzf sui-testnet-v1.18.0-macos-x86_64.tgz"
    echo "   sudo mv sui /usr/local/bin/"
    exit 1
fi

# Check if we're connected to testnet
NETWORK=$(sui client active-env)
if [ "$NETWORK" != "testnet" ]; then
    echo "⚠️  Current network: $NETWORK"
    echo "🔄 Switching to testnet..."
    sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
    sui client switch --env testnet
fi

echo "📋 Current network: $(sui client active-env)"
echo "👤 Current address: $(sui client active-address)"

# Check if we have gas
echo "⛽ Checking gas balance..."
GAS_BALANCE=$(sui client gas | grep -o '[0-9]*' | head -1)
if [ "$GAS_BALANCE" -lt 1000000000 ]; then
    echo "❌ Insufficient gas balance: $GAS_BALANCE"
    echo "💡 Please request testnet SUI from: https://docs.sui.io/guides/developer/getting-started/get-coins"
    exit 1
fi

echo "✅ Gas balance: $GAS_BALANCE"

# Build the contract
echo "🔨 Building multi-token swap contract..."
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Deploy the contract
echo "🚀 Deploying contract..."
DEPLOY_RESULT=$(sui client publish --gas-budget 100000000)

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

# Extract contract information
PACKAGE_ID=$(echo "$DEPLOY_RESULT" | grep -o 'packageId: [a-f0-9]*' | cut -d' ' -f2)
ADMIN_CAP_ID=$(echo "$DEPLOY_RESULT" | grep -o 'objectId: [a-f0-9]*' | head -1 | cut -d' ' -f2)
TREASURY_ID=$(echo "$DEPLOY_RESULT" | grep -o 'objectId: [a-f0-9]*' | tail -1 | cut -d' ' -f2)

echo "✅ Deployment successful!"
echo ""
echo "📋 Contract Information:"
echo "   Package ID: $PACKAGE_ID"
echo "   Admin Cap ID: $ADMIN_CAP_ID"
echo "   Treasury ID: $TREASURY_ID"
echo ""
echo "🔗 Testnet Explorer: https://suiexplorer.com/object/$PACKAGE_ID?network=testnet"
echo ""

# Save contract info to file
cat > contract-info.json << EOF
{
  "network": "testnet",
  "packageId": "$PACKAGE_ID",
  "adminCapId": "$ADMIN_CAP_ID",
  "treasuryId": "$TREASURY_ID",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "supportedTokens": [
    {
      "symbol": "SUI",
      "address": "0x2::sui::SUI",
      "decimals": 9,
      "minAmount": "1000000000",
      "maxAmount": "100000000000000"
    },
    {
      "symbol": "USDC",
      "address": "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bfc::coin::COIN",
      "decimals": 6,
      "minAmount": "1000000",
      "maxAmount": "100000000000"
    },
    {
      "symbol": "USDT",
      "address": "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
      "decimals": 6,
      "minAmount": "1000000",
      "maxAmount": "100000000000"
    }
  ],
  "initialExchangeRates": {
    "SUI": "5853000000",
    "USDC": "1649000000",
    "USDT": "1650000000"
  }
}
EOF

echo "💾 Contract information saved to: contract-info.json"
echo ""
echo "🎉 Multi-Token Swap Contract deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Update your frontend with the new Package ID: $PACKAGE_ID"
echo "   2. Test SUI swaps first"
echo "   3. Test USDC/USDT swaps"
echo "   4. Update exchange rates as needed using admin functions"
echo ""
echo "🔧 Admin Commands:"
echo "   # Update exchange rates"
echo "   sui client call --package $PACKAGE_ID --module multi_token_swap --function update_exchange_rates --args $ADMIN_CAP_ID --gas-budget 10000000"
echo ""
echo "   # Check contract info"
echo "   sui client call --package $PACKAGE_ID --module multi_token_swap --function get_contract_info --args <CONTRACT_ID> --gas-budget 10000000"
echo ""
echo "   # Check treasury info"
echo "   sui client call --package $PACKAGE_ID --module multi_token_swap --function get_treasury_info --args $TREASURY_ID --gas-budget 10000000"

