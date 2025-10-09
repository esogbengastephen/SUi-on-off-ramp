# OFF-RAMP Wallet Validation System

This system provides comprehensive wallet validation for OFF-RAMP transactions on the SUI blockchain, ensuring users have sufficient tokens and gas fees before processing transactions.

## Features

- **Pre-transaction Validation**: Checks user wallet balances before initiating Paystack transfers
- **Multi-token Support**: Validates SUI, USDC, and USDT tokens
- **Gas Fee Estimation**: Calculates required SUI for gas fees
- **Real-time Monitoring**: Firebase integration for wallet balance tracking
- **Error Handling**: Automatic form reset after 5 seconds on failure
- **User Feedback**: Clear error messages and validation status

## Components

### 1. Wallet Validation Utilities (`src/utils/suiWalletValidation.ts`)

Core functions for checking wallet balances and validating transactions:

```typescript
// Check all token balances
const balances = await getAllTokenBalances(userAddress);

// Validate wallet for OFF-RAMP
const validation = await validateUserWalletForOffRamp(
  userAddress, 
  'USDC', 
  100
);

// Check gas fee sufficiency
const gasCheck = await hasSufficientGasFee(userAddress);
```

### 2. React Hooks (`src/hooks/useWalletValidation.ts`)

Custom hooks for wallet validation in React components:

```typescript
// Main validation hook
const {
  isValidating,
  canProceed,
  errorMessage,
  balances,
  validateWallet
} = useWalletValidation({
  userAddress: '0x...',
  tokenType: 'USDC',
  swapAmount: 100,
  autoCheck: true
});

// Gas fee check hook
const {
  hasSufficient,
  suiBalance,
  estimatedGasFee
} = useGasFeeCheck(userAddress);

// Token balances hook
const {
  balances,
  isLoading,
  fetchBalances
} = useTokenBalances(userAddress);
```

### 3. UI Components

#### WalletValidationComponent
Displays wallet validation status and balance information:

```typescript
<WalletValidationComponent
  userAddress={userAddress}
  tokenType="USDC"
  swapAmount={100}
  onValidationChange={(canProceed, errorMessage) => {
    // Handle validation changes
  }}
/>
```

#### EnhancedOffRampForm
Complete OFF-RAMP form with built-in validation:

```typescript
<EnhancedOffRampForm
  userAddress={userAddress}
  onSubmit={async (formData) => {
    // Process OFF-RAMP transaction
  }}
/>
```

### 4. Firebase Integration (`src/utils/firebaseWalletMonitoring.ts`)

Tracks wallet balances and validation history:

```typescript
// Save wallet balances
await saveUserWalletBalances(userAddress, balances);

// Log validation results
await logWalletValidation(
  userAddress,
  'USDC',
  100,
  true,
  undefined,
  balances,
  { swapToken: 100, gasFee: 0.015 }
);

// Real-time monitoring
const { walletRecord, isLoading } = useRealtimeWalletMonitoring(userAddress);
```

## Usage Example

```typescript
import React from 'react';
import { EnhancedOffRampForm } from '@/components/EnhancedOffRampForm';

function OffRampPage() {
  const userAddress = '0x...'; // User's wallet address

  const handleSubmit = async (formData) => {
    try {
      // Your existing OFF-RAMP logic here
      console.log('Processing:', formData);
      
      // The validation has already been done by the form
      // Proceed with Paystack transfer and smart contract execution
      
    } catch (error) {
      // Error handling is built into the form
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      <h1>OFF-RAMP Transaction</h1>
      <EnhancedOffRampForm
        userAddress={userAddress}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

## Validation Flow

1. **User Input**: User enters token type, amount, and bank details
2. **Balance Check**: System checks user's wallet balances
3. **Gas Fee Check**: Verifies sufficient SUI for gas fees
4. **Validation**: Determines if transaction can proceed
5. **User Feedback**: Shows validation status and balance details
6. **Transaction**: Only proceeds if validation passes
7. **Error Handling**: Resets form after 5 seconds if transaction fails

## Error Messages

- **"Insufficient SUI for swap and gas fees"**: User doesn't have enough SUI tokens
- **"Insufficient USDC for swap"**: User doesn't have enough USDC tokens
- **"Insufficient USDT for swap"**: User doesn't have enough USDT tokens
- **"Insufficient gas fee to complete transaction"**: User doesn't have enough SUI for gas fees
- **"Error checking wallet balance"**: Network or API error

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
```

### Token Addresses

The system uses these token addresses on Sui mainnet:

- **SUI**: `0x2::sui::SUI`
- **USDC**: `0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN`
- **USDT**: `0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN`

### Gas Fee Estimation

Default gas fee estimation:
- Base fee: 0.01 SUI
- Buffer: 0.005 SUI
- Total: 0.015 SUI

## Integration with Existing Code

To integrate with your existing OFF-RAMP implementation:

1. **Replace existing form** with `EnhancedOffRampForm`
2. **Update transaction logic** to use validation results
3. **Add Firebase collections** for wallet monitoring
4. **Update error handling** to use form reset instead of page refresh

## Firebase Collections

The system creates these Firebase collections:

- `userWallets`: User wallet balances and history
- `walletValidationLogs`: Detailed validation logs
- `transactions`: Existing transaction records

## Benefits

- **Prevents Failed Transactions**: Validates wallet before Paystack transfer
- **Better User Experience**: Clear feedback and automatic error recovery
- **Real-time Monitoring**: Firebase integration for admin dashboard
- **Comprehensive Logging**: Complete audit trail of wallet validations
- **Multi-token Support**: Handles SUI, USDC, and USDT tokens
- **Gas Fee Management**: Ensures sufficient SUI for transaction fees

## Testing

Test the validation system with different scenarios:

1. **Sufficient funds**: User has enough tokens and gas fees
2. **Insufficient tokens**: User lacks the swap token
3. **Insufficient gas**: User lacks SUI for gas fees
4. **Network errors**: API failures and connection issues
5. **Invalid addresses**: Malformed wallet addresses

The system handles all these scenarios gracefully with appropriate error messages and user feedback.
