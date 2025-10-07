#!/bin/bash

# Transaction Limits Management Script
# This script helps manage transaction limits for the Sui Naira Swap contract

# Configuration
PACKAGE_ID="0x94458968eec5a09243ddb68b4eb2d366da80f36566d6bfba04859982f34dfe3d"
SWAP_CONTRACT_ID="0xb5a494a7253e5030ba0ab012f268eedccfd9338f4ed1698c2a6b28324cc1f2c9"
ADMIN_CAP_ID="0xa5537d54de2e590c9ae01ff56b5c59f793fcefc2f1aa40f06bc6493a9d304d26"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Transaction Limits Management Script${NC}"
echo "================================================"

# Function to get current limits
get_current_limits() {
    echo -e "${YELLOW}📊 Getting current transaction limits...${NC}"
    
    sui client object $SWAP_CONTRACT_ID --json | jq -r '
        "Current Limits:" +
        "\n  Min Swap Amount: " + (.fields.min_swap_amount | tostring) + " MIST" +
        "\n  Max Swap Amount: " + (.fields.max_swap_amount | tostring) + " MIST" +
        "\n  Exchange Rate: " + (.fields.exchange_rate | tostring) + " NGN per SUI" +
        "\n  Paused: " + (.fields.paused | tostring)
    '
}

# Function to update limits
update_limits() {
    local min_amount=$1
    local max_amount=$2
    
    if [ -z "$min_amount" ] || [ -z "$max_amount" ]; then
        echo -e "${RED}❌ Error: Please provide both min and max amounts${NC}"
        echo "Usage: $0 update <min_amount_mist> <max_amount_mist>"
        exit 1
    fi
    
    echo -e "${YELLOW}🔄 Updating transaction limits...${NC}"
    echo "Min Amount: $min_amount MIST"
    echo "Max Amount: $max_amount MIST"
    
    sui client call \
        --package $PACKAGE_ID \
        --module swap \
        --function update_swap_limits \
        --args $SWAP_CONTRACT_ID $min_amount $max_amount $ADMIN_CAP_ID \
        --gas-budget 10000000
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Transaction limits updated successfully!${NC}"
        get_current_limits
    else
        echo -e "${RED}❌ Failed to update transaction limits${NC}"
    fi
}

# Function to set reasonable default limits
set_default_limits() {
    echo -e "${YELLOW}🔄 Setting default transaction limits...${NC}"
    
    # Convert to MIST (1 SUI = 1,000,000,000 MIST)
    local min_sui=0.1
    local max_sui=1000
    local min_mist=$(echo "$min_sui * 1000000000" | bc)
    local max_mist=$(echo "$max_sui * 1000000000" | bc)
    
    echo "Setting limits:"
    echo "  Min: $min_sui SUI ($min_mist MIST)"
    echo "  Max: $max_sui SUI ($max_mist MIST)"
    
    update_limits $min_mist $max_mist
}

# Function to set conservative limits
set_conservative_limits() {
    echo -e "${YELLOW}🔄 Setting conservative transaction limits...${NC}"
    
    # Convert to MIST (1 SUI = 1,000,000,000 MIST)
    local min_sui=1
    local max_sui=100
    local min_mist=$(echo "$min_sui * 1000000000" | bc)
    local max_mist=$(echo "$max_sui * 1000000000" | bc)
    
    echo "Setting conservative limits:"
    echo "  Min: $min_sui SUI ($min_mist MIST)"
    echo "  Max: $max_sui SUI ($max_mist MIST)"
    
    update_limits $min_mist $max_mist
}

# Function to set high limits
set_high_limits() {
    echo -e "${YELLOW}🔄 Setting high transaction limits...${NC}"
    
    # Convert to MIST (1 SUI = 1,000,000,000 MIST)
    local min_sui=0.1
    local max_sui=10000
    local min_mist=$(echo "$min_sui * 1000000000" | bc)
    local max_mist=$(echo "$max_sui * 1000000000" | bc)
    
    echo "Setting high limits:"
    echo "  Min: $min_sui SUI ($min_mist MIST)"
    echo "  Max: $max_sui SUI ($max_mist MIST)"
    
    update_limits $min_mist $max_mist
}

# Function to show help
show_help() {
    echo "Usage: $0 <command> [arguments]"
    echo ""
    echo "Commands:"
    echo "  get                    - Get current transaction limits"
    echo "  update <min> <max>     - Update limits (amounts in MIST)"
    echo "  default                - Set default limits (0.1-1000 SUI)"
    echo "  conservative           - Set conservative limits (1-100 SUI)"
    echo "  high                   - Set high limits (0.1-10000 SUI)"
    echo "  help                   - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 get"
    echo "  $0 update 100000000 1000000000000"
    echo "  $0 default"
    echo "  $0 conservative"
    echo ""
    echo "Note: Amounts are in MIST (1 SUI = 1,000,000,000 MIST)"
}

# Main script logic
case "$1" in
    "get")
        get_current_limits
        ;;
    "update")
        update_limits "$2" "$3"
        ;;
    "default")
        set_default_limits
        ;;
    "conservative")
        set_conservative_limits
        ;;
    "high")
        set_high_limits
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
