#!/bin/bash

# Fund Treasury Script for SwitcherFi Multi-Token Contract
# This script deposits SUI tokens to the treasury for testing

echo "🚀 Funding SwitcherFi Treasury..."
echo "=================================="

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
echo "💰 Depositing SUI to treasury..."

# Create transaction to deposit SUI tokens
sui client call \
  --package $PACKAGE_ID \
  --module multi_token_swap \
  --function deposit_tokens \
  --args $TREASURY_ID $SWAP_CONTRACT_ID $DEPOSIT_AMOUNT "SUI" \
  --gas-budget 10000000

echo ""
echo "✅ Treasury funding completed!"
echo "🔍 Checking updated treasury balance..."
sui client object $TREASURY_ID

echo ""
echo "📊 Summary:"
echo "  - Deposited: 1 SUI"
echo "  - Treasury should now have: 1 SUI balance"
echo "  - Ready for testing swaps!"
