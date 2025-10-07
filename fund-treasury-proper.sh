#!/bin/bash

# Fund Treasury Script for SwitcherFi Original Single-Token Contract
# This script properly deposits SUI tokens to the treasury using the contract function

echo "🚀 Funding SwitcherFi Treasury (Proper Method)..."
echo "=================================================="

# Contract addresses from .env
SWAP_CONTRACT_ID="0xb5a494a7253e5030ba0ab012f268eedccfd9338f4ed1698c2a6b28324cc1f2c9"
TREASURY_ID="0x3d14b2c3f871b3a577ec777337f2ab6d465b82cd833987461e7e1210670b7595"
PACKAGE_ID="0x94458968eec5a09243ddb68b4eb2d366da80f36566d6bfba04859982f34dfe3d"

# Amount to deposit (in MIST - 1 SUI = 1,000,000,000 MIST)
DEPOSIT_AMOUNT="1000000000"  # 1 SUI

echo "📋 Contract Details:"
echo "  Swap Contract: $SWAP_CONTRACT_ID"
echo "  Treasury: $TREASURY_ID"
echo "  Package: $PACKAGE_ID"
echo "  Deposit Amount: $DEPOSIT_AMOUNT MIST (1 SUI)"
echo ""

# Check current treasury balance
echo "🔍 Checking current treasury balance..."
sui client object $TREASURY_ID

echo ""
echo "💰 Depositing SUI to treasury using contract function..."

# First, let's split a coin to get the exact amount we want to deposit
echo "Step 1: Splitting coin for deposit..."
SPLIT_RESULT=$(sui client split-coin --coin-id 0x0b9101bb805dc7c1b88af972229a874daa3de2d529877d8df86aa67749c3dbdf --amounts $DEPOSIT_AMOUNT --gas-budget 10000000 --json)

if [ $? -eq 0 ]; then
    echo "✅ Coin split successful!"
    
    # Extract the new coin ID from the result
    NEW_COIN_ID=$(echo $SPLIT_RESULT | jq -r '.effects.created[0].reference.objectId')
    echo "New coin ID: $NEW_COIN_ID"
    
    echo ""
    echo "Step 2: Depositing to treasury..."
    
    # Now deposit the split coin to treasury
    sui client call \
      --package $PACKAGE_ID \
      --module swap \
      --function deposit_to_treasury \
      --args $TREASURY_ID $NEW_COIN_ID \
      --gas-budget 10000000
    
    echo ""
    echo "✅ Treasury funding completed!"
    echo "🔍 Checking updated treasury balance..."
    sui client object $TREASURY_ID
    
    echo ""
    echo "📊 Summary:"
    echo "  - Deposited: 1 SUI"
    echo "  - Treasury balance updated"
    echo "  - Ready for testing swaps!"
else
    echo "❌ Coin split failed. Trying alternative method..."
    
    # Alternative: Use merge-coin to combine smaller coins first
    echo "Trying to merge smaller coins first..."
    sui client merge-coin --primary-coin-id 0x0b9101bb805dc7c1b88af972229a874daa3de2d529877d8df86aa67749c3dbdf --coin-to-merge 0x3c141cbca39e32f92b7dc254af8fa28edc8fce1798a0e8f2c6c9da1adde5ee09 --gas-budget 10000000
    
    echo "Now trying split again..."
    sui client split-coin --coin-id 0x0b9101bb805dc7c1b88af972229a874daa3de2d529877d8df86aa67749c3dbdf --amounts $DEPOSIT_AMOUNT --gas-budget 10000000
fi
