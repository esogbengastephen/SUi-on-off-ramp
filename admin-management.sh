#!/bin/bash

# SwitcherFi Admin Management Script
# This script provides admin functions for contract management

echo "🔐 SwitcherFi Admin Management"
echo "=============================="

# Contract addresses
SWAP_CONTRACT_ID="0xb5a494a7253e5030ba0ab012f268eedccfd9338f4ed1698c2a6b28324cc1f2c9"
TREASURY_ID="0x3d14b2c3f871b3a577ec777337f2ab6d465b82cd833987461e7e1210670b7595"
ADMIN_CAP_ID="0xa5537d54de2e590c9ae01ff56b5c59f793fcefc2f1aa40f06bc6493a9d304d26"
PACKAGE_ID="0x94458968eec5a09243ddb68b4eb2d366da80f36566d6bfba04859982f34dfe3d"

# Function to show current contract status
show_status() {
    echo "📊 Current Contract Status:"
    echo "=========================="
    
    echo "🔍 Contract Info:"
    sui client call \
      --package $PACKAGE_ID \
      --module multi_token_swap \
      --function get_contract_info \
      --args $SWAP_CONTRACT_ID \
      --gas-budget 10000000
    
    echo ""
    echo "💰 Treasury Info:"
    sui client call \
      --package $PACKAGE_ID \
      --module multi_token_swap \
      --function get_treasury_info \
      --args $TREASURY_ID \
      --gas-budget 10000000
}

# Function to update exchange rates
update_rates() {
    echo "💱 Updating Exchange Rates..."
    echo "Current rates: SUI=5853, USDC=1649, USDT=1650 NGN"
    
    # New rates (in Naira per token with 6 decimal precision)
    NEW_SUI_RATE="6000000000"    # 6000 NGN per SUI
    NEW_USDC_RATE="1700000000"   # 1700 NGN per USDC  
    NEW_USDT_RATE="1700000000"   # 1700 NGN per USDT
    
    echo "New rates: SUI=6000, USDC=1700, USDT=1700 NGN"
    
    sui client call \
      --package $PACKAGE_ID \
      --module multi_token_swap \
      --function update_exchange_rates \
      --args $SWAP_CONTRACT_ID $ADMIN_CAP_ID "[$NEW_SUI_RATE,$NEW_USDC_RATE,$NEW_USDT_RATE]" \
      --gas-budget 10000000
    
    echo "✅ Exchange rates updated!"
}

# Function to pause/unpause contract
toggle_pause() {
    echo "⏸️  Toggle Contract Pause State..."
    
    read -p "Enter 'pause' to pause or 'unpause' to unpause: " action
    
    if [ "$action" = "pause" ]; then
        echo "⏸️  Pausing contract..."
        sui client call \
          --package $PACKAGE_ID \
          --module multi_token_swap \
          --function set_pause_state \
          --args $SWAP_CONTRACT_ID $ADMIN_CAP_ID "true" \
          --gas-budget 10000000
        echo "✅ Contract paused!"
    elif [ "$action" = "unpause" ]; then
        echo "▶️  Unpausing contract..."
        sui client call \
          --package $PACKAGE_ID \
          --module multi_token_swap \
          --function set_pause_state \
          --args $SWAP_CONTRACT_ID $ADMIN_CAP_ID "false" \
          --gas-budget 10000000
        echo "✅ Contract unpaused!"
    else
        echo "❌ Invalid action. Use 'pause' or 'unpause'"
    fi
}

# Function to withdraw tokens from treasury
withdraw_tokens() {
    echo "💸 Withdraw Tokens from Treasury..."
    
    read -p "Enter token type (SUI/USDC/USDT): " token_type
    read -p "Enter amount (in smallest units): " amount
    
    echo "Withdrawing $amount $token_type from treasury..."
    
    sui client call \
      --package $PACKAGE_ID \
      --module multi_token_swap \
      --function withdraw_tokens \
      --args $TREASURY_ID $SWAP_CONTRACT_ID $amount "$token_type" \
      --gas-budget 10000000
    
    echo "✅ Tokens withdrawn!"
}

# Function to get exchange rate for specific token
get_token_rate() {
    echo "📈 Get Token Exchange Rate..."
    
    read -p "Enter token type (SUI/USDC/USDT): " token_type
    
    sui client call \
      --package $PACKAGE_ID \
      --module multi_token_swap \
      --function get_exchange_rate \
      --args $SWAP_CONTRACT_ID "$token_type" \
      --gas-budget 10000000
}

# Function to get amount limits for token
get_token_limits() {
    echo "📏 Get Token Amount Limits..."
    
    read -p "Enter token type (SUI/USDC/USDT): " token_type
    
    sui client call \
      --package $PACKAGE_ID \
      --module multi_token_swap \
      --function get_amount_limits \
      --args $SWAP_CONTRACT_ID "$token_type" \
      --gas-budget 10000000
}

# Main menu
while true; do
    echo ""
    echo "🎛️  Admin Menu:"
    echo "1. Show Contract Status"
    echo "2. Update Exchange Rates"
    echo "3. Pause/Unpause Contract"
    echo "4. Withdraw Tokens"
    echo "5. Get Token Exchange Rate"
    echo "6. Get Token Amount Limits"
    echo "7. Exit"
    
    read -p "Select option (1-7): " choice
    
    case $choice in
        1) show_status ;;
        2) update_rates ;;
        3) toggle_pause ;;
        4) withdraw_tokens ;;
        5) get_token_rate ;;
        6) get_token_limits ;;
        7) echo "👋 Goodbye!"; exit 0 ;;
        *) echo "❌ Invalid option. Please select 1-7." ;;
    esac
done
