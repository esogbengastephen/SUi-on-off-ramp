#!/bin/bash

# Multi-Token Contract Test Script
# This script tests the multi-token swap contract functions

set -e

echo "🧪 Testing Multi-Token Swap Contract..."

# Load contract info
if [ ! -f "contract-info.json" ]; then
    echo "❌ contract-info.json not found. Please deploy the contract first."
    exit 1
fi

PACKAGE_ID=$(cat contract-info.json | grep -o '"packageId": "[^"]*"' | cut -d'"' -f4)
TREASURY_ID=$(cat contract-info.json | grep -o '"treasuryId": "[^"]*"' | cut -d'"' -f4)
ADMIN_CAP_ID=$(cat contract-info.json | grep -o '"adminCapId": "[^"]*"' | cut -d'"' -f4)

if [ -z "$PACKAGE_ID" ] || [ -z "$TREASURY_ID" ] || [ -z "$ADMIN_CAP_ID" ]; then
    echo "❌ Invalid contract-info.json format"
    exit 1
fi

echo "📋 Contract Info:"
echo "   Package ID: $PACKAGE_ID"
echo "   Treasury ID: $TREASURY_ID"
echo "   Admin Cap ID: $ADMIN_CAP_ID"
echo ""

# Test 1: Check if SUI is supported
echo "🔍 Test 1: Checking if SUI is supported..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function is_token_supported \
    --args $PACKAGE_ID '"SUI"' \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ SUI support check passed"
else
    echo "❌ SUI support check failed"
fi

# Test 2: Check if USDC is supported
echo "🔍 Test 2: Checking if USDC is supported..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function is_token_supported \
    --args $PACKAGE_ID '"USDC"' \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ USDC support check passed"
else
    echo "❌ USDC support check failed"
fi

# Test 3: Check if USDT is supported
echo "🔍 Test 3: Checking if USDT is supported..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function is_token_supported \
    --args $PACKAGE_ID '"USDT"' \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ USDT support check passed"
else
    echo "❌ USDT support check failed"
fi

# Test 4: Get SUI exchange rate
echo "🔍 Test 4: Getting SUI exchange rate..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function get_exchange_rate \
    --args $PACKAGE_ID '"SUI"' \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ SUI exchange rate check passed"
else
    echo "❌ SUI exchange rate check failed"
fi

# Test 5: Get USDC exchange rate
echo "🔍 Test 5: Getting USDC exchange rate..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function get_exchange_rate \
    --args $PACKAGE_ID '"USDC"' \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ USDC exchange rate check passed"
else
    echo "❌ USDC exchange rate check failed"
fi

# Test 6: Get USDT exchange rate
echo "🔍 Test 6: Getting USDT exchange rate..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function get_exchange_rate \
    --args $PACKAGE_ID '"USDT"' \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ USDT exchange rate check passed"
else
    echo "❌ USDT exchange rate check failed"
fi

# Test 7: Get SUI amount limits
echo "🔍 Test 7: Getting SUI amount limits..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function get_amount_limits \
    --args $PACKAGE_ID '"SUI"' \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ SUI amount limits check passed"
else
    echo "❌ SUI amount limits check failed"
fi

# Test 8: Get treasury info
echo "🔍 Test 8: Getting treasury info..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function get_treasury_info \
    --args $TREASURY_ID \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ Treasury info check passed"
else
    echo "❌ Treasury info check failed"
fi

# Test 9: Get contract info
echo "🔍 Test 9: Getting contract info..."
sui client call \
    --package $PACKAGE_ID \
    --module multi_token_swap \
    --function get_contract_info \
    --args $PACKAGE_ID \
    --gas-budget 10000000

if [ $? -eq 0 ]; then
    echo "✅ Contract info check passed"
else
    echo "❌ Contract info check failed"
fi

echo ""
echo "🎉 Multi-Token Contract testing completed!"
echo ""
echo "📝 Next steps:"
echo "   1. If all tests passed, your contract is ready for frontend integration"
echo "   2. Update your frontend with the Package ID: $PACKAGE_ID"
echo "   3. Test actual swap transactions with real tokens"
echo "   4. Update exchange rates as needed"
echo ""
echo "🔗 Contract Explorer: https://suiexplorer.com/object/$PACKAGE_ID?network=testnet"

