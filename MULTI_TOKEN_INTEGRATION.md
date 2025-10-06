# Multi-Token Swap Contract Integration Guide

## Overview
This guide shows how to integrate the new multi-token swap contract with your SwitcherFi frontend application.

## Key Changes from Single-Token Contract

### 1. Contract Structure
- **Old**: `SwapContract` → **New**: `MultiTokenSwapContract`
- **Old**: `SwapTransaction` → **New**: `MultiTokenSwapTransaction`
- **Old**: `Treasury` → **New**: `MultiTokenTreasury`

### 2. Supported Tokens
- **SUI**: Native Sui token (9 decimals)
- **USDC**: USD Coin (6 decimals)
- **USDT**: Tether USD (6 decimals)

### 3. New Functions

#### Contract Functions
```move
// Create OFF_RAMP transaction (Token → Naira)
public fun create_off_ramp_transaction<T>(
    contract: &mut MultiTokenSwapContract,
    treasury: &mut MultiTokenTreasury,
    payment: Coin<T>,
    token_type: String,
    bank_account: String,
    bank_name: String,
    ctx: &mut TxContext
): MultiTokenSwapTransaction

// Create ON_RAMP transaction (Naira → Token)
public fun create_on_ramp_transaction(
    contract: &mut MultiTokenSwapContract,
    token_type: String,
    naira_amount: u64,
    payment_reference: String,
    payment_source_account: String,
    payment_source_bank: String,
    payment_source_name: String,
    ctx: &mut TxContext
): MultiTokenSwapTransaction
```

#### View Functions
```move
// Check if token is supported
public fun is_token_supported(contract: &MultiTokenSwapContract, token_type: &String): bool

// Get exchange rate for a token
public fun get_exchange_rate(contract: &MultiTokenSwapContract, token_type: &String): u64

// Get min/max amounts for a token
public fun get_amount_limits(contract: &MultiTokenSwapContract, token_type: &String): (u64, u64)
```

## Frontend Integration Steps

### 1. Update Contract Configuration

Create a new contract configuration file:

```typescript
// src/lib/multi-token-contract.ts
export const MULTI_TOKEN_CONTRACT = {
  packageId: "YOUR_PACKAGE_ID", // From deployment
  moduleName: "multi_token_swap",
  treasuryId: "YOUR_TREASURY_ID", // From deployment
  adminCapId: "YOUR_ADMIN_CAP_ID", // From deployment
} as const;

export const SUPPORTED_TOKENS = {
  SUI: {
    symbol: "SUI",
    name: "Sui",
    address: "0x2::sui::SUI",
    decimals: 9,
    minAmount: "1000000000", // 1 SUI
    maxAmount: "100000000000000", // 100,000 SUI
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bfc::coin::COIN",
    decimals: 6,
    minAmount: "1000000", // 1 USDC
    maxAmount: "100000000000", // 100,000 USDC
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    decimals: 6,
    minAmount: "1000000", // 1 USDT
    maxAmount: "100000000000", // 100,000 USDT
  },
} as const;

export type SupportedTokenSymbol = keyof typeof SUPPORTED_TOKENS;
```

### 2. Update Smart Contract Hook

```typescript
// src/hooks/useMultiTokenContract.ts
import { useSuiClient } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { MULTI_TOKEN_CONTRACT, SUPPORTED_TOKENS, SupportedTokenSymbol } from '@/lib/multi-token-contract';

export function useMultiTokenContract() {
  const client = useSuiClient();

  // Create OFF_RAMP transaction
  const createOffRampTransaction = async (
    tokenType: SupportedTokenSymbol,
    amount: string,
    bankAccount: string,
    bankName: string,
    coinId: string
  ) => {
    const txb = new TransactionBlock();
    
    // Get token info
    const tokenInfo = SUPPORTED_TOKENS[tokenType];
    
    // Move call to create off-ramp transaction
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::create_off_ramp_transaction`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.packageId), // contract
        txb.object(MULTI_TOKEN_CONTRACT.treasuryId), // treasury
        txb.object(coinId), // payment coin
        txb.pure.string(tokenType), // token type
        txb.pure.string(bankAccount), // bank account
        txb.pure.string(bankName), // bank name
      ],
      typeArguments: [tokenInfo.address], // token type argument
    });

    return await client.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
  };

  // Create ON_RAMP transaction
  const createOnRampTransaction = async (
    tokenType: SupportedTokenSymbol,
    nairaAmount: string,
    paymentReference: string,
    paymentSourceAccount: string,
    paymentSourceBank: string,
    paymentSourceName: string
  ) => {
    const txb = new TransactionBlock();
    
    // Move call to create on-ramp transaction
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::create_on_ramp_transaction`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.packageId), // contract
        txb.pure.string(tokenType), // token type
        txb.pure.u64(nairaAmount), // naira amount
        txb.pure.string(paymentReference), // payment reference
        txb.pure.string(paymentSourceAccount), // payment source account
        txb.pure.string(paymentSourceBank), // payment source bank
        txb.pure.string(paymentSourceName), // payment source name
      ],
    });

    return await client.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
  };

  // Get exchange rate for a token
  const getExchangeRate = async (tokenType: SupportedTokenSymbol) => {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::get_exchange_rate`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.packageId), // contract
        txb.pure.string(tokenType), // token type
      ],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: MULTI_TOKEN_CONTRACT.packageId, // Use package as sender for view calls
    });

    return result.results?.[0]?.returnValues?.[0]?.[0];
  };

  // Get amount limits for a token
  const getAmountLimits = async (tokenType: SupportedTokenSymbol) => {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::get_amount_limits`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.packageId), // contract
        txb.pure.string(tokenType), // token type
      ],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: MULTI_TOKEN_CONTRACT.packageId,
    });

    return {
      minAmount: result.results?.[0]?.returnValues?.[0]?.[0],
      maxAmount: result.results?.[0]?.returnValues?.[1]?.[0],
    };
  };

  return {
    createOffRampTransaction,
    createOnRampTransaction,
    getExchangeRate,
    getAmountLimits,
  };
}
```

### 3. Update Swap Page Component

```typescript
// src/app/swap/page.tsx - Key updates
import { useMultiTokenContract } from '@/hooks/useMultiTokenContract';
import { SUPPORTED_TOKENS, SupportedTokenSymbol } from '@/lib/multi-token-contract';

// In your component:
const { createOffRampTransaction, getExchangeRate } = useMultiTokenContract();

// Update token selection logic
const handleTokenSelection = async (tokenSymbol: SupportedTokenSymbol) => {
  setFromCurrency(tokenSymbol);
  
  // Get live exchange rate from contract
  try {
    const contractRate = await getExchangeRate(tokenSymbol);
    if (contractRate) {
      // Convert contract rate to display format
      const displayRate = Number(contractRate) / 1000000; // Convert from 6-decimal precision
      setCurrentPrice(displayRate);
    }
  } catch (error) {
    console.error('Failed to get exchange rate:', error);
    // Fallback to API price
  }
};

// Update swap execution
const handleSwap = async () => {
  if (!selectedToken || !fromAmount || !bankAccount || !bankName) return;
  
  try {
    setIsSwapping(true);
    
    // Get user's coin for the selected token
    const tokenInfo = SUPPORTED_TOKENS[fromCurrency];
    const userCoins = await client.getCoins({
      owner: address!,
      coinType: tokenInfo.address,
    });
    
    if (userCoins.data.length === 0) {
      throw new Error(`No ${fromCurrency} coins found`);
    }
    
    // Use the first coin (you might want to implement coin selection logic)
    const coinId = userCoins.data[0].coinObjectId;
    
    // Create off-ramp transaction
    const result = await createOffRampTransaction(
      fromCurrency,
      fromAmount,
      bankAccount,
      bankName,
      coinId
    );
    
    console.log('Swap transaction created:', result);
    toast.success(`${fromCurrency} swap transaction created successfully!`);
    
  } catch (error) {
    console.error('Swap failed:', error);
    toast.error(`Swap failed: ${error.message}`);
  } finally {
    setIsSwapping(false);
  }
};
```

### 4. Update Token Balance Checking

```typescript
// src/hooks/useTokenBalances.ts
import { useSuiClient } from '@mysten/dapp-kit';
import { SUPPORTED_TOKENS, SupportedTokenSymbol } from '@/lib/multi-token-contract';

export function useTokenBalances(address: string) {
  const client = useSuiClient();
  
  const getTokenBalance = async (tokenSymbol: SupportedTokenSymbol) => {
    const tokenInfo = SUPPORTED_TOKENS[tokenSymbol];
    
    try {
      const coins = await client.getCoins({
        owner: address,
        coinType: tokenInfo.address,
      });
      
      const totalBalance = coins.data.reduce((sum, coin) => {
        return sum + Number(coin.balance);
      }, 0);
      
      // Convert from smallest unit to display unit
      return totalBalance / Math.pow(10, tokenInfo.decimals);
    } catch (error) {
      console.error(`Failed to get ${tokenSymbol} balance:`, error);
      return 0;
    }
  };
  
  const getAllBalances = async () => {
    const balances: Record<SupportedTokenSymbol, number> = {} as any;
    
    for (const tokenSymbol of Object.keys(SUPPORTED_TOKENS) as SupportedTokenSymbol[]) {
      balances[tokenSymbol] = await getTokenBalance(tokenSymbol);
    }
    
    return balances;
  };
  
  return {
    getTokenBalance,
    getAllBalances,
  };
}
```

## Testing Checklist

### 1. Contract Deployment
- [ ] Deploy contract to testnet
- [ ] Verify package ID, treasury ID, admin cap ID
- [ ] Test contract initialization

### 2. Token Support
- [ ] Test SUI swaps (OFF_RAMP and ON_RAMP)
- [ ] Test USDC swaps (OFF_RAMP and ON_RAMP)
- [ ] Test USDT swaps (OFF_RAMP and ON_RAMP)
- [ ] Verify exchange rates for each token

### 3. Frontend Integration
- [ ] Update contract configuration
- [ ] Test token selection dropdown
- [ ] Test balance checking for all tokens
- [ ] Test swap execution for each token
- [ ] Test error handling

### 4. Admin Functions
- [ ] Test exchange rate updates
- [ ] Test treasury management
- [ ] Test pause/unpause functionality

## Migration from Single-Token Contract

1. **Backup current contract**: Keep the old contract for reference
2. **Deploy new contract**: Use the deployment script
3. **Update frontend**: Replace contract calls with multi-token versions
4. **Test thoroughly**: Test all three tokens before going live
5. **Update documentation**: Update API docs and user guides

## Common Issues and Solutions

### Issue: "Unsupported token type"
**Solution**: Ensure token type string matches exactly: "SUI", "USDC", "USDT"

### Issue: "Insufficient balance"
**Solution**: Check token decimals and convert amounts correctly

### Issue: "Invalid amount"
**Solution**: Verify amounts are within min/max limits for each token

### Issue: Contract not found
**Solution**: Verify package ID and ensure contract is deployed to correct network

## Next Steps

1. Deploy the multi-token contract using the provided script
2. Update your frontend with the new contract integration
3. Test with SUI first, then add USDC/USDT support
4. Update exchange rates as needed
5. Deploy to mainnet when ready

The multi-token contract provides full support for SUI, USDC, and USDT with proper validation, treasury management, and transaction tracking. Your SwitcherFi application will now be able to handle all three tokens seamlessly!

