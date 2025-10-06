# 🔑 Wallet Import Guide

## Import Your Admin Wallet to Browser Extension

### **Step 1: Open Sui Wallet Extension**
1. Open your browser (Chrome, Firefox, etc.)
2. Click on the Sui Wallet extension icon
3. If you don't have it installed, get it from: https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil

### **Step 2: Import Wallet**
1. Click "Import Wallet" or "Add Account"
2. Choose "Import using Recovery Phrase"
3. Enter your recovery phrase:
   ```
   agree anger possible craft tent resemble fatigue section token mercy flee sail
   ```
4. Set a wallet name (e.g., "SUI Admin Wallet")
5. Set a password for the wallet

### **Step 3: Verify Import**
1. Your wallet address should be: `0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580`
2. You should see your SUI balance (around 0.16 SUI)

### **Step 4: Access Admin Dashboard**
1. Go to: http://localhost:3000/admin
2. Click "Connect Wallet" 
3. Select your imported wallet
4. You should now have full admin access!

## 🔐 Alternative: Import Using Private Key

If you prefer to import using the private key:

1. In Sui Wallet, choose "Import using Private Key"
2. Enter the private key:
   ```
   00672c6e30c57707549d2647a9255ff92a1bad3ceec25ddd50156c556d811bb973
   ```
3. Set wallet name and password
4. Verify the address matches: `0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580`

## ⚠️ Security Notes

- **Never share your recovery phrase or private key**
- **Store them securely offline**
- **This wallet has full admin control over your contract**
- **Test with small amounts first**

## 🎯 What You Can Do Now

With your admin wallet connected, you can:
- ✅ Pause/Unpause the contract
- ✅ Update exchange rates
- ✅ Confirm ON-RAMP payments
- ✅ Complete OFF-RAMP transactions
- ✅ Monitor treasury balance
- ✅ View all transaction details

## 🚀 Next Steps

1. **Test the admin functions** with small amounts
2. **Set up proper exchange rates** for your region
3. **Configure treasury management**
4. **Test the full swap flow** end-to-end
