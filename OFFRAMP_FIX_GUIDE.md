# OFF-RAMP Fix Integration Guide

## 🚨 **Immediate Problem Fix**

The error you're seeing ("packageID not found") happens because:
1. **Smart contract not deployed** or **packageID missing** from environment
2. **Paystack transfer succeeds** but **smart contract fails**
3. **User loses money** but **doesn't get tokens**

## 🔧 **Quick Fix Steps**

### **Step 1: Fix Contract Configuration**
```bash
# Run the fix script
./fix-offramp.sh
```

This will:
- Deploy your smart contract
- Get the packageID and contractID
- Create proper .env.local configuration

### **Step 2: Update Your Existing OFF-RAMP Code**

Replace your current OFF-RAMP logic in `src/app/swap/page.tsx` with wallet validation:

```typescript
// Add this import at the top
import { validateUserWalletForOffRamp } from '@/utils/suiWalletValidation';

// Replace your handleSwapExecution function with this:
const handleSwapExecution = async () => {
  if (!currentWallet) {
    toast.error("Please connect your wallet first")
    return
  }

  const suiAmount = parseFloat(fromAmount)
  const nairaAmount = parseFloat(toAmount)

  try {
    if (isOffRamp) {
      // CRITICAL: Validate wallet BEFORE any transaction
      const validation = await validateUserWalletForOffRamp(
        currentWallet.address,
        fromCurrency as 'SUI' | 'USDC' | 'USDT',
        suiAmount
      );

      if (!validation.canProceed) {
        toast.error(validation.errorMessage || 'Insufficient funds');
        return;
      }

      // Check contract configuration
      if (!process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || !process.env.NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID) {
        toast.error('Smart contract not configured. Please contact support.');
        return;
      }

      // Verify bank account details
      if (!verifiedAccountName || !verifiedAccountNumber || !verifiedBankCode) {
        toast.error("Please verify your bank account details first")
        return
      }

      // Create transfer recipient
      const recipient = await createTransferRecipient(verifiedAccountNumber, verifiedBankCode, verifiedAccountName)
      if (!recipient) {
        toast.error("Failed to set up bank account for transfers")
        return
      }

      // Execute smart contract transaction FIRST
      await initiateOffRamp(
        process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID,
        suiAmount,
        {
          account_name: verifiedAccountName,
          account_number: verifiedAccountNumber,
          bank_code: verifiedBankCode,
        }
      )

      // Only then initiate Paystack transfer
      setTransferStatus("pending")
      const transfer = await initiateTransfer(
        recipient.recipient_code,
        nairaAmount,
        `OFF-RAMP: ${fromCurrency} to Naira`
      )

      if (transfer) {
        setTransferId(transfer.transfer_code)
        toast.success("Transfer initiated successfully!")
      } else {
        toast.error("Failed to initiate transfer")
      }
    }
  } catch (error) {
    console.error('OFF-RAMP error:', error)
    toast.error(error instanceof Error ? error.message : 'Transaction failed')
  }
}
```

### **Step 3: Add Wallet Validation Component**

Add this to your OFF-RAMP section in the UI:

```typescript
// Add this import
import { WalletValidationComponent } from '@/components/WalletValidationComponent';

// Add this component in your OFF-RAMP form section
{isOffRamp && fromAmount && parseFloat(fromAmount) > 0 && (
  <WalletValidationComponent
    userAddress={currentWallet?.address || ''}
    tokenType={fromCurrency as 'SUI' | 'USDC' | 'USDT'}
    swapAmount={parseFloat(fromAmount)}
    onValidationChange={(canProceed, errorMessage) => {
      if (!canProceed && errorMessage) {
        toast.error(errorMessage);
      }
    }}
  />
)}
```

## 🎯 **What This Fixes**

### **Before (Current Problem):**
1. User initiates OFF-RAMP
2. Paystack transfer succeeds ✅
3. Smart contract fails ❌ (packageID not found)
4. User loses money but gets no tokens ❌

### **After (Fixed):**
1. User initiates OFF-RAMP
2. **Wallet validation checks balances** ✅
3. **Contract configuration verified** ✅
4. **Smart contract executes FIRST** ✅
5. **Only then Paystack transfer** ✅
6. **User gets tokens AND money** ✅

## 🔍 **Error Prevention**

The wallet validation system prevents these errors:

- **"Insufficient SUI for swap and gas fees"** - User doesn't have enough SUI
- **"Insufficient USDC for swap"** - User doesn't have enough USDC
- **"Insufficient USDT for swap"** - User doesn't have enough USDT
- **"Insufficient gas fee to complete transaction"** - User doesn't have SUI for gas fees
- **"Smart contract not configured"** - Missing packageID/contractID

## 🚀 **Testing the Fix**

1. **Run the fix script**: `./fix-offramp.sh`
2. **Update your code** with the validation logic above
3. **Test with insufficient funds** - should show error and prevent transaction
4. **Test with sufficient funds** - should work normally
5. **Test contract errors** - should show configuration error

## 📋 **Environment Variables Required**

Make sure your `.env.local` has:

```env
# SUI Contract Configuration
NEXT_PUBLIC_SWAP_CONTRACT_ID=your_contract_id
NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID=your_package_id

# Paystack Configuration
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# SUI RPC Configuration
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

## ⚡ **Quick Test**

After implementing the fix:

1. **Connect wallet** with insufficient SUI
2. **Try OFF-RAMP** - should show "Insufficient gas fee" error
3. **Add SUI to wallet** - should allow transaction
4. **Test transaction** - should work end-to-end

The wallet validation system ensures users never lose money due to failed smart contract executions!
