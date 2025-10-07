#!/bin/bash

# SwitcherFi Admin Management Script (Original Single-Token Contract)
# This script provides admin functions for contract management

echo "🔐 SwitcherFi Admin Management (Original Contract)"
echo "================================================="

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
      --module swap \
      --function get_contract_info \
      --args $SWAP_CONTRACT_ID \
      --gas-budget 10000000
    
    echo ""
    echo "💰 Treasury Info:"
    sui client call \
      --package $PACKAGE_ID \
      --module swap \
      --function get_treasury_info \
      --args $TREASURY_ID \
      --gas-budget 10000000
}

# Function to update exchange rate
update_rate() {
    echo "💱 Updating Exchange Rate..."
    echo "Current rate: ~5853 NGN per SUI"
    
    read -p "Enter new exchange rate (in Naira per SUI): " new_rate
    
    # Convert to proper format (with 6 decimal precision)
    NEW_RATE=$((new_rate * 1000000))
    
    echo "Setting new rate: $new_rate NGN per SUI ($NEW_RATE with precision)"
    
    sui client call \
      --package $PACKAGE_ID \
      --module swap \
      --function update_exchange_rate \
      --args $SWAP_CONTRACT_ID $ADMIN_CAP_ID $NEW_RATE \
      --gas-budget 10000000
    
    echo "✅ Exchange rate updated!"
}

# Function to pause/unpause contract
toggle_pause() {
    echo "⏸️  Toggle Contract Pause State..."
    
    read -p "Enter 'pause' to pause or 'unpause' to unpause: " action
    
    if [ "$action" = "pause" ]; then
        echo "⏸️  Pausing contract..."
        sui client call \
          --package $PACKAGE_ID \
          --module swap \
          --function set_pause_state \
          --args $SWAP_CONTRACT_ID $ADMIN_CAP_ID "true" \
          --gas-budget 10000000
        echo "✅ Contract paused!"
    elif [ "$action" = "unpause" ]; then
        echo "▶️  Unpausing contract..."
        sui client call \
          --package $PACKAGE_ID \
          --module swap \
          --function set_pause_state \
          --args $SWAP_CONTRACT_ID $ADMIN_CAP_ID "false" \
          --gas-budget 10000000
        echo "✅ Contract unpaused!"
    else
        echo "❌ Invalid action. Use 'pause' or 'unpause'"
    fi
}

# Function to update min/max amounts
update_limits() {
    echo "📏 Update Min/Max Swap Amounts..."
    
    read -p "Enter minimum amount (in MIST): " min_amount
    read -p "Enter maximum amount (in MIST): " max_amount
    
    echo "Setting min: $min_amount MIST, max: $max_amount MIST"
    
    sui client call \
      --package $PACKAGE_ID \
      --module swap \
      --function update_amount_limits \
      --args $SWAP_CONTRACT_ID $ADMIN_CAP_ID $min_amount $max_amount \
      --gas-budget 10000000
    
    echo "✅ Amount limits updated!"
}

# Function to withdraw SUI from treasury
withdraw_sui() {
    echo "💸 Withdraw SUI from Treasury..."
    
    read -p "Enter amount to withdraw (in MIST): " amount
    
    echo "Withdrawing $amount MIST from treasury..."
    
    sui client call \
      --package $PACKAGE_ID \
      --module swap \
      --function withdraw_sui \
      --args $TREASURY_ID $SWAP_CONTRACT_ID $ADMIN_CAP_ID $amount \
      --gas-budget 10000000
    
    echo "✅ SUI withdrawn!"
}

# Function to deposit SUI to treasury
deposit_sui() {
    echo "💰 Deposit SUI to Treasury..."
    
    read -p "Enter amount to deposit (in MIST): " amount
    
    echo "Depositing $amount MIST to treasury..."
    
    sui client call \
      --package $PACKAGE_ID \
      --module swap \
      --function deposit_sui \
      --args $TREASURY_ID $SWAP_CONTRACT_ID $amount \
      --gas-budget 10000000
    
    echo "✅ SUI deposited!"
}

# Function to update treasury address
update_treasury_address() {
    echo "🏦 Update Treasury Address..."
    
    read -p "Enter new treasury address: " new_address
    
    echo "Updating treasury address to: $new_address"
    
    sui client call \
      --package $PACKAGE_ID \
      --module swap \
      --function update_treasury_address \
      --args $SWAP_CONTRACT_ID $new_address $ADMIN_CAP_ID \
      --gas-budget 10000000
    
    echo "✅ Treasury address updated!"
}

# Main menu
while true; do
    echo ""
    echo "🎛️  Admin Menu:"
    echo "1. Show Contract Status"
    echo "2. Update Exchange Rate"
    echo "3. Pause/Unpause Contract"
    echo "4. Update Min/Max Amounts"
    echo "5. Withdraw SUI from Treasury"
    echo "6. Deposit SUI to Treasury"
    echo "7. Update Treasury Address"
    echo "8. Exit"
    
    read -p "Select option (1-8): " choice
    
    case $choice in
        1) show_status ;;
        2) update_rate ;;
        3) toggle_pause ;;
        4) update_limits ;;
        5) withdraw_sui ;;
        6) deposit_sui ;;
        7) update_treasury_address ;;
        8) echo "👋 Goodbye!"; exit 0 ;;
        *) echo "❌ Invalid option. Please select 1-8." ;;
    esac
done
