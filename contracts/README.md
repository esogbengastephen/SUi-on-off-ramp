# SUI-Naira Swap Smart Contract

A comprehensive Sui Move smart contract for handling cryptocurrency to fiat currency swaps with automatic wallet operations.

## Overview

This smart contract implements a dual-direction swap system:
- **OFF-RAMP**: SUI → Naira (User sends SUI, receives Naira to bank account)
- **ON-RAMP**: Naira → SUI (User sends Naira, receives SUI to wallet)

## Key Features

### 🔄 Automatic Wallet Operations
- **OFF-RAMP**: Automatically deducts SUI from user's connected wallet
- **ON-RAMP**: Automatically sends SUI to user's wallet after payment confirmation
- **Treasury Management**: Centralized SUI token management

### 🛡️ Security Features
- **Admin Controls**: Pause/unpause functionality
- **Amount Limits**: Configurable minimum and maximum swap amounts
- **Authorization**: Admin-only functions for payment confirmation
- **Transaction Tracking**: Complete audit trail

### 📊 Transaction Management
- **Real-time Status**: PENDING → CONFIRMED → COMPLETED
- **Event Emission**: Comprehensive event logging
- **Transaction Records**: Immutable transaction history

## Contract Architecture

### Core Objects

#### SwapContract
- Main contract object with admin controls
- Exchange rate management
- Swap limits configuration
- Transaction counter

#### SwapTransaction
- Individual transaction records
- Status tracking (PENDING/CONFIRMED/COMPLETED/FAILED)
- Bank account details for OFF-RAMP
- Payment references for ON-RAMP

#### Treasury
- Centralized SUI token management
- Balance tracking
- Deposit/withdrawal records

#### AdminCap
- Admin authorization capability
- Required for administrative functions

## Usage Flow

### OFF-RAMP (SUI → Naira)

1. **User Initiates Swap**:
   ```move
   initiate_off_ramp(swap_contract, payment, bank_account, bank_name, ctx)
   ```
   - User provides SUI tokens
   - Specifies bank account details
   - SUI automatically deducted from wallet

2. **Admin Processes Payment**:
   ```move
   complete_off_ramp(swap_contract, transaction, admin_cap, ctx)
   ```
   - Admin confirms Naira sent to user's bank
   - Transaction marked as COMPLETED

### ON-RAMP (Naira → SUI)

1. **User Initiates Swap**:
   ```move
   initiate_on_ramp(swap_contract, naira_amount, payment_reference, ctx)
   ```
   - User provides payment reference
   - Transaction created in PENDING status

2. **Admin Confirms Payment**:
   ```move
   confirm_on_ramp_payment(swap_contract, treasury, transaction, payment, admin_cap, ctx)
   ```
   - Admin verifies Naira payment received
   - SUI automatically sent to user's wallet
   - Transaction marked as COMPLETED

## Admin Functions

### Contract Management
- `pause_contract()` - Pause all swap operations
- `unpause_contract()` - Resume swap operations
- `update_exchange_rate()` - Modify SUI/Naira exchange rate
- `update_swap_limits()` - Set minimum/maximum swap amounts
- `update_treasury_address()` - Change treasury wallet

### Treasury Management
- `deposit_to_treasury()` - Add SUI to treasury
- Treasury balance tracking and reporting

## Events

### SwapInitiated
- Emitted when user initiates any swap
- Contains transaction details and amounts

### PaymentConfirmed
- Emitted when ON-RAMP payment is verified
- Triggers automatic SUI transfer

### SwapCompleted
- Emitted when swap is fully processed
- Final status update

### SwapFailed
- Emitted for failed transactions
- Contains failure reason

## Security Considerations

### Access Control
- Admin functions require `AdminCap`
- Treasury operations protected
- User can only modify their own transactions

### Validation
- Amount limits enforced
- Transaction status validation
- Duplicate processing prevention

### Emergency Controls
- Contract pause functionality
- Admin override capabilities
- Comprehensive event logging

## Deployment

### Prerequisites
- Sui CLI installed
- Sui wallet configured
- Sui tokens for deployment

### Steps
1. **Build Contract**:
   ```bash
   sui move build
   ```

2. **Deploy Contract**:
   ```bash
   sui client publish --gas-budget 100000000
   ```

3. **Initialize Contract**:
   ```bash
   sui client call --package <PACKAGE_ID> --module swap --function init --gas-budget 10000000
   ```

## Integration with Frontend

### Required API Endpoints
- `/api/initiate-off-ramp` - Start OFF-RAMP swap
- `/api/initiate-on-ramp` - Start ON-RAMP swap
- `/api/confirm-payment` - Admin payment confirmation
- `/api/get-transaction` - Retrieve transaction status

### WebSocket Events
- Real-time transaction status updates
- Payment confirmation notifications
- Swap completion alerts

## Configuration

### Default Settings
- **Exchange Rate**: 1 SUI = 3000 Naira
- **Minimum Swap**: 1 SUI
- **Maximum Swap**: 100 SUI
- **Admin**: Contract deployer

### Customization
All parameters can be updated by admin after deployment using the management functions.

## Error Handling

### Error Codes
- `ESUNAIRA_SWAP`: General swap error
- `EINSUFFICIENT_BALANCE`: Insufficient SUI balance
- `EINVALID_AMOUNT`: Amount outside limits
- `ETRANSACTION_NOT_FOUND`: Transaction doesn't exist
- `ETRANSACTION_ALREADY_PROCESSED`: Transaction already completed
- `EUNAUTHORIZED`: Admin authorization required
- `ESWAP_PAUSED`: Contract is paused

### Failure Scenarios
- **Insufficient Treasury Balance**: ON-RAMP fails if treasury lacks SUI
- **Invalid Amounts**: Transactions rejected if outside limits
- **Contract Paused**: All operations halted during pause
- **Authorization Failure**: Admin functions require proper authorization

## Testing

### Test Scenarios
1. **Successful OFF-RAMP**: User sends SUI, receives Naira
2. **Successful ON-RAMP**: User sends Naira, receives SUI
3. **Failed Transactions**: Insufficient balance, invalid amounts
4. **Admin Functions**: Pause, rate updates, treasury management
5. **Edge Cases**: Maximum amounts, minimum amounts, zero amounts

### Test Commands
```bash
# Run all tests
sui move test

# Run specific test
sui move test test_off_ramp_success
```

## Monitoring

### Key Metrics
- **Transaction Volume**: Number of swaps per day
- **Treasury Balance**: Available SUI for ON-RAMP
- **Success Rate**: Percentage of completed swaps
- **Average Processing Time**: Time from initiation to completion

### Alerts
- **Low Treasury Balance**: Alert when treasury needs refilling
- **Failed Transactions**: Monitor for systematic issues
- **High Volume**: Alert for unusual activity

## Future Enhancements

### Planned Features
- **Multi-token Support**: Support for USDC, USDT
- **Automated Rate Updates**: Oracle-based exchange rates
- **Batch Processing**: Multiple transactions in single call
- **Fee Management**: Configurable swap fees
- **Liquidity Pools**: Decentralized liquidity management

### Integration Opportunities
- **Payment Gateways**: Direct integration with Paystack/OPay
- **Banking APIs**: Automated bank transfers
- **Compliance Tools**: KYC/AML integration
- **Analytics Dashboard**: Real-time monitoring interface
