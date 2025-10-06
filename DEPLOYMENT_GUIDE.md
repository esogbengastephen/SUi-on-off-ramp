# Smart Contract Deployment Guide

## 🚀 **Step-by-Step Deployment Instructions**

### **1. Prerequisites**
Make sure you have:
- Sui CLI installed and configured
- Test SUI tokens in your wallet
- Your wallet address ready

### **2. Get Your Wallet Address**
```bash
# Get your current address
sui client active-address

# If you need to create a new address
sui client new-address ed25519
```

### **3. Get Test Tokens**
Visit the Sui faucet: https://faucet.sui.io/
- Paste your wallet address
- Request test tokens
- Wait for confirmation

### **4. Deploy the Contract**
```bash
# Navigate to contracts directory
cd contracts

# Build the contract
sui move build

# Publish the contract (replace with your gas budget if needed)
sui client publish --gas-budget 100000000
```

### **5. Initialize the Contract**
After publishing, you'll get a package ID and need to initialize:

```bash
# Replace <PACKAGE_ID> with the actual package ID from publish
# Replace <YOUR_ADDRESS> with your wallet address
# Replace <TREASURY_ADDRESS> with your treasury address (can be same as your address)

sui client call \
  --package <PACKAGE_ID> \
  --module sui_naira_swap \
  --function init \
  --args <YOUR_ADDRESS> <TREASURY_ADDRESS> \
  --gas-budget 10000000
```

### **6. Configure Frontend**
Create/update `.env.local` file:
```env
NEXT_PUBLIC_SWAP_CONTRACT_ID=<SWAP_CONTRACT_OBJECT_ID>
NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID=<PACKAGE_ID>
PAYSTACK_SECRET_KEY=<YOUR_PAYSTACK_SECRET_KEY>
```

### **7. Admin Configuration**
The contract will create an `AdminCap` object. You'll need this for admin functions.

## 🔧 **Contract Configuration Options**

### **Exchange Rate**
- Default: 1500 Naira per SUI
- Can be updated via admin functions

### **Swap Limits**
- Default: 1-1000 SUI
- Can be updated via admin functions

### **Treasury Address**
- Set during initialization
- Can be updated via admin functions

## 📋 **Important Notes**

1. **Testnet Only**: This is configured for Sui testnet
2. **Admin Access**: Only the address used in `init` gets admin capabilities
3. **Treasury**: Must have SUI tokens for ON-RAMP operations
4. **Backup**: Save your package ID and contract object ID

## 🎯 **Next Steps After Deployment**

1. Test wallet connection at: http://localhost:3000/wallet-test
2. Test swap functionality at: http://localhost:3000/swap
3. Access admin dashboard at: http://localhost:3000/admin
4. Configure Paystack for bank verification

## 🆘 **Troubleshooting**

### **Wallet Connection Issues**
- Visit: http://localhost:3000/wallet-test
- Check browser console for errors
- Ensure wallet extension is installed and unlocked

### **Contract Deployment Issues**
- Check you have enough SUI for gas
- Verify network is set to testnet
- Check contract compilation errors

### **Bank Verification Issues**
- Paystack API has rate limits (429 errors)
- Consider implementing retry logic
- Use test account numbers for development