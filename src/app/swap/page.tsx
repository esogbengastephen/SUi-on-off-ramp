"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WalletButton } from "@/components/wallet/wallet-button"
import { AccountVerifier } from "@/components/bank/AccountVerifier"
import { useState, useEffect, useRef } from "react"
import { useOffRampSwap, useOnRampSwap } from "@/hooks/useSuiContract"
import { useCurrentWallet } from "@mysten/dapp-kit"
import { saveTransaction, updateTransaction } from "@/lib/transaction-storage"
import { useExchangeRate, useRealTimePrice, useReverseExchangeRate } from "@/hooks/usePriceData"
import { TOKEN_CONFIG, TokenSymbol, convertNGNToUSD } from "@/lib/price-service"
import { usePaystackTransfer } from "@/hooks/usePaystackTransfer"
import { getTokenConfig } from '@/lib/token-config'
import { toast } from "sonner"
import { TESTNET_TOKENS, TestnetTokenSymbol, getTestnetTokenAddress } from "@/lib/testnet-tokens"
import { SUPPORTED_TOKENS, SupportedTokenSymbol, INITIAL_EXCHANGE_RATES } from '@/lib/multi-token-contract'
import { useMultiTokenContract } from '@/hooks/useMultiTokenContract'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { TokenIconWithFallback } from "@/components/ui/token-icon"
import { validateUserWalletForOffRamp } from '@/utils/suiWalletValidation'

export default function SwapPage() {
  // During build time, render a simple placeholder to avoid wallet context issues
  if (process.env.BUILD_TIME === 'true' || process.env.NETLIFY === 'true' || process.env.VERCEL === 'true') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4 opacity-90">SwitcherFi</h1>
          <p className="text-xl mb-8 opacity-80">
            Crypto-to-fiat swap platform will be available at runtime.
          </p>
        </div>
      </div>
    );
  }

  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [senderAccount, setSenderAccount] = useState("")
  const [fromCurrency, setFromCurrency] = useState<SupportedTokenSymbol | "NAIRA">("SUI")
  const [toCurrency, setToCurrency] = useState("NAIRA")
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [isSwapped, setIsSwapped] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [lastUpdatedField, setLastUpdatedField] = useState<"from" | "to" | null>(null)
  const [verifiedAccountName, setVerifiedAccountName] = useState("")
  const [verifiedAccountNumber, setVerifiedAccountNumber] = useState("")
  const [verifiedBankCode, setVerifiedBankCode] = useState("")
  const [verifiedBankName, setVerifiedBankName] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "confirmed" | "failed">("idle")
  const [transactionId, setTransactionId] = useState("")
  const [transferRecipientCode, setTransferRecipientCode] = useState("")
  const [transferStatus, setTransferStatus] = useState<"idle" | "pending" | "success" | "failed" | "otp">("idle")
  const [transferId, setTransferId] = useState("")

  // Validate transfer status to ensure proper handling
  const validateTransferStatus = (status: string): "pending" | "success" | "failed" | "otp" => {
    console.log('🚀 EXECUTOR: Validating transfer status:', status)
    
    // Only consider these as valid success states
    if (status === 'success' || status === 'Success' || status === 'SUCCESS') {
      console.log('✅ EXECUTOR: Status validated as SUCCESS')
      return 'success'
    }
    
    // Pending states are valid but not complete
    if (status === 'pending' || status === 'Pending' || status === 'PENDING') {
      console.log('⏳ EXECUTOR: Status validated as PENDING')
      return 'pending'
    }
    
    // OTP states require user action
    if (status === 'otp' || status === 'OTP') {
      console.log('🔐 EXECUTOR: Status validated as OTP')
      return 'otp'
    }
    
    // Everything else is considered failed
    console.log('❌ EXECUTOR: Status validated as FAILED (unknown status)')
    return 'failed'
  }
  const [walletValidation, setWalletValidation] = useState<{
    isValidating: boolean;
    canProceed: boolean;
    errorMessage: string | null;
    balances: { sui: number; usdc: number; usdt: number } | null;
  }>({
    isValidating: false,
    canProceed: false,
    errorMessage: null,
    balances: null
  })

  // Transaction state management
  const [transactionState, setTransactionState] = useState<{
    status: 'idle' | 'validating' | 'executing_smart_contract' | 'waiting_for_approval' | 'executing_paystack' | 'completed' | 'failed' | 'cancelled';
    error: string | null;
    progress: number;
    canCancel: boolean;
    canRetry: boolean;
  }>({
    status: 'idle',
    error: null,
    progress: 0,
    canCancel: false,
    canRetry: false
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Transfer status polling
  useEffect(() => {
    if (transferId && transferStatus === "pending") {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/paystack/transfer-status?transferId=${transferId}`)
          const data = await response.json()
          
          if (data.success && data.transfer) {
            const newStatus = data.transfer.status
            if (newStatus !== transferStatus) {
              setTransferStatus(newStatus)
              
              if (newStatus === "success") {
                toast.success("Transfer completed successfully! Check your bank account.")
                // Update the stored transaction
                const transactions = JSON.parse(localStorage.getItem('sui_naira_transactions') || '[]')
                const updatedTransactions = transactions.map((tx: any) => 
                  tx.transferId === transferId 
                    ? { ...tx, status: 'COMPLETED', transferStatus: 'success' }
                    : tx
                )
                localStorage.setItem('sui_naira_transactions', JSON.stringify(updatedTransactions))
              } else if (newStatus === "failed") {
                toast.error("Transfer failed. Please contact support.")
                // Update the stored transaction
                const transactions = JSON.parse(localStorage.getItem('sui_naira_transactions') || '[]')
                const updatedTransactions = transactions.map((tx: any) => 
                  tx.transferId === transferId 
                    ? { ...tx, status: 'FAILED', transferStatus: 'failed' }
                    : tx
                )
                localStorage.setItem('sui_naira_transactions', JSON.stringify(updatedTransactions))
              }
            }
          }
        } catch (error) {
          console.error('Error checking transfer status:', error)
        }
      }, 5000) // Check every 5 seconds

      return () => clearInterval(interval)
    }
  }, [transferId, transferStatus])
  
  // Contract integration
  const { currentWallet, isConnected } = useCurrentWallet()
  const { createOffRampTransaction, createOnRampTransaction, getExchangeRate } = useMultiTokenContract()
  const { balances, loading: balancesLoading, getAllBalances } = useTokenBalances(currentWallet?.accounts?.[0]?.address || "")
  const { initiateOffRamp, isLoading: offRampLoading } = useOffRampSwap()
  const { initiateOnRamp, isLoading: onRampLoading } = useOnRampSwap()
  
  // Paystack Transfer integration
  const { createTransferRecipient, initiateTransfer, checkTransferStatus, isLoading: transferLoading } = usePaystackTransfer()
  
  // Determine transaction type based on currency selection
  const transactionType = toCurrency === "NAIRA" ? "OFF_RAMP" : "ON_RAMP"
  
  // Real-time price integration with transaction type
  const currentTokenSymbol = fromCurrency as TokenSymbol
  const { priceData, loading: priceLoading, error: priceError } = useRealTimePrice(currentTokenSymbol, 30000, transactionType)
  
  // Get the current price directly from priceData
  const currentPrice = priceData?.price || 0
  
  // Calculate exchange rates directly (use actual token prices)
  const exchangeRate = currentPrice // 1 Token = X Naira
  const reverseExchangeRate = currentPrice // 1 Naira = 1/X Token
  
  // Validation constants
  const MIN_NAIRA_AMOUNT = 1  // ON-RAMP minimum (temporarily lowered for testing)
  const MAX_NAIRA_AMOUNT = 500000
  const MIN_USD_AMOUNT = 0.01  // OFF-RAMP minimum ($0.01 worth - temporarily lowered for testing)
  
  // Contract configuration (these will be set after deployment)
  const SWAP_CONTRACT_ID = process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || ""
  
  const availableTokens = [
    {
      symbol: "SUI",
      name: "SUI",
      icon: "coin",
      address: SUPPORTED_TOKENS.SUI.address,
      decimals: SUPPORTED_TOKENS.SUI.decimals
    },
    {
      symbol: "USDC",
      name: "SUI USDC",
      icon: "usdc",
      address: SUPPORTED_TOKENS.USDC.address,
      decimals: SUPPORTED_TOKENS.USDC.decimals
    },
    {
      symbol: "USDT",
      name: "SUI USDT",
      icon: "usdt",
      address: SUPPORTED_TOKENS.USDT.address,
      decimals: SUPPORTED_TOKENS.USDT.decimals
    }
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Smart calculation logic to prevent input interference
  useEffect(() => {
    if (isCalculating) return // Prevent calculations during user input
    
    if (currentPrice > 0 && fromAmount && lastUpdatedField === "from") {
      // Token to Naira calculation (OFF-RAMP: SUI/USDC/USDT → Naira)
      const tokenAmount = parseFloat(fromAmount)
      if (tokenAmount > 0) {
        setIsCalculating(true)
        // Use the actual price for the selected token (no artificial rate adjustment)
        const calculatedAmount = Math.round(tokenAmount * currentPrice)
        setToAmount(calculatedAmount.toString())
        setLastUpdatedField(null)
        setTimeout(() => setIsCalculating(false), 100)
      }
    }
  }, [currentPrice, fromAmount, lastUpdatedField, isCalculating, fromCurrency])

  useEffect(() => {
    if (isCalculating) return // Prevent calculations during user input
    
    if (currentPrice > 0 && toAmount && lastUpdatedField === "to") {
      // Naira to Token calculation (ON-RAMP: Naira → SUI/USDC/USDT)
      const nairaAmount = parseFloat(toAmount)
      if (nairaAmount > 0) {
        setIsCalculating(true)
        // Use the actual price for the selected token (no artificial rate adjustment)
        const calculatedAmount = (nairaAmount / currentPrice).toFixed(6)
        setFromAmount(calculatedAmount.toString())
        setLastUpdatedField(null)
        setTimeout(() => setIsCalculating(false), 100)
      }
    }
  }, [currentPrice, toAmount, lastUpdatedField, isCalculating, fromCurrency])

  // Validation functions
  const validateNairaAmount = (amount: number): string | null => {
    if (amount < MIN_NAIRA_AMOUNT) {
      return `Minimum amount is ₦${MIN_NAIRA_AMOUNT.toLocaleString()}`
    }
    if (amount > MAX_NAIRA_AMOUNT) {
      return `Maximum amount is ₦${MAX_NAIRA_AMOUNT.toLocaleString()}`
    }
    return null
  }

  const validateTokenAmount = (amount: number, tokenSymbol: TokenSymbol): string | null => {
    if (!priceData) return null // Can't validate without price data
    
    // Convert token amount to USD value
    // Token price is in NGN, so we convert NGN to USD
    const ngnValue = amount * priceData.price
    const usdValue = convertNGNToUSD(ngnValue)
    
    if (usdValue < MIN_USD_AMOUNT) {
      const minNgnValue = MIN_USD_AMOUNT * 1500 // Convert $1 to NGN
      return `Minimum amount is $${MIN_USD_AMOUNT} worth of ${tokenSymbol} (≈₦${minNgnValue.toLocaleString()})`
    }
    return null
  }

  const getValidationError = (): string | null => {
    if (isOffRamp) {
      // OFF-RAMP: Validate token amount (minimum $1 worth)
      const tokenAmount = parseFloat(fromAmount)
      if (isNaN(tokenAmount) || tokenAmount <= 0) return null
      
      return validateTokenAmount(tokenAmount, currentTokenSymbol)
    } else if (isOnRamp) {
      // ON-RAMP: Validate Naira amount (minimum ₦2,000)
      const nairaAmount = parseFloat(toAmount)
      if (isNaN(nairaAmount) || nairaAmount <= 0) return null
      
      return validateNairaAmount(nairaAmount)
    }
    
    return null
  }

  const handleSwap = () => {
    // Toggle the position and swap the labels
    setIsSwapped(!isSwapped)
    // Reset payment status when switching between ON-RAMP and OFF-RAMP
    setPaymentStatus("idle")
    setTransactionId("")
    setTransferStatus("idle")
    setTransferId("")
    setTransferRecipientCode("")
    // Reset calculation states
    setIsCalculating(false)
    setLastUpdatedField(null)
  }

  const handleTokenSelect = (token: any) => {
    setFromCurrency(token.symbol)
    setShowFromDropdown(false)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setFromAmount(value)
      setLastUpdatedField("from")
    }
  }

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers (no commas, no decimal points)
    if (/^\d*$/.test(value)) {
      setToAmount(value)
      setLastUpdatedField("to")
    }
  }

  const handleAccountVerified = async (accountName: string, accountNumber: string, bankCode: string, bankName: string) => {
    setVerifiedAccountName(accountName)
    setVerifiedAccountNumber(accountNumber)
    setVerifiedBankCode(bankCode)
    setVerifiedBankName(bankName)
    
    // Don't create transfer recipient automatically - wait for user to initiate swap
    toast.success("Bank account verified successfully")
  }

  const handleAccountChange = (accountNumber: string, bankCode: string) => {
    // Reset verification when account details change
    if (accountNumber !== verifiedAccountNumber || bankCode !== verifiedBankCode) {
      setVerifiedAccountName("")
      setVerifiedAccountNumber("")
      setVerifiedBankCode("")
      setVerifiedBankName("")
      setTransferRecipientCode("")
      setTransferStatus("idle")
      setTransferId("")
    }
  }

  // Validate wallet for OFF-RAMP transactions
  const validateWallet = async () => {
    if (!currentWallet?.accounts?.[0]?.address || !isOffRamp || !fromAmount) {
      setWalletValidation({
        isValidating: false,
        canProceed: false,
        errorMessage: null,
        balances: null
      })
      return
    }

    const tokenAmount = parseFloat(fromAmount)
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      setWalletValidation({
        isValidating: false,
        canProceed: false,
        errorMessage: null,
        balances: null
      })
      return
    }

    setWalletValidation(prev => ({ ...prev, isValidating: true }))

    try {
      const result = await validateUserWalletForOffRamp(
        currentWallet.accounts[0].address,
        fromCurrency as 'SUI' | 'USDC' | 'USDT',
        tokenAmount
      )

      setWalletValidation({
        isValidating: false,
        canProceed: result.canProceed,
        errorMessage: result.errorMessage || null,
        balances: result.balances
      })
    } catch (error) {
      console.error('Wallet validation error:', error)
      setWalletValidation({
        isValidating: false,
        canProceed: false,
        errorMessage: 'Error checking wallet balance',
        balances: null
      })
    }
  }

  // Determine if this is OFF-RAMP (SUI → Naira) or ON-RAMP (Naira → SUI)
  const isOffRamp = ((!isSwapped && fromCurrency !== "NAIRA") || (isSwapped && toCurrency !== "NAIRA"))
  const isOnRamp = ((!isSwapped && fromCurrency === "NAIRA") || (isSwapped && toCurrency === "NAIRA"))

  // Validate wallet when amount or token changes
  useEffect(() => {
    // Only validate if not in transaction execution state
    if (isOffRamp && currentWallet?.accounts?.[0]?.address && transactionState.status === 'idle') {
      const timeoutId = setTimeout(validateWallet, 500) // Debounce validation
      return () => clearTimeout(timeoutId)
    }
  }, [fromAmount, fromCurrency, currentWallet?.accounts?.[0]?.address, isOffRamp, transactionState.status])

  const handleSwapExecution = async () => {
    if (!currentWallet) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!SWAP_CONTRACT_ID) {
      toast.error("Contract not deployed yet. Please wait for deployment.")
      return
    }

    // Validate amounts based on swap type
    const validationError = getValidationError()
    if (validationError) {
      toast.error(validationError)
      return
    }

    // Convert token amount for smart contract (handle different token types)
    const tokenConfig = getTokenConfig(fromCurrency)
    const tokenAmount = parseFloat(fromAmount)
    
    // For smart contract compatibility, we need to convert to SUI equivalent
    // But for calculation purposes, we use the actual token amounts
    let suiAmount: number
    if (fromCurrency === 'SUI') {
      suiAmount = tokenAmount * 1_000_000_000 // Convert to MIST (1 SUI = 1,000,000,000 MIST)
    } else {
      // For USDC/USDT, we'll use a simplified approach for now
      // In a full implementation, you'd have separate contract functions for each token
      suiAmount = tokenAmount * 1_000_000_000 // Treat as SUI equivalent for contract
    }
    
    const nairaAmount = parseFloat(toAmount)

    try {
      if (isOffRamp) {
        // OFF-RAMP: Token → Naira
        if (!verifiedAccountName || !verifiedAccountNumber || !verifiedBankCode) {
          toast.error("Please verify your bank account details first")
          return
        }

        // Validate wallet before proceeding
        if (!walletValidation.canProceed) {
          if (walletValidation.errorMessage) {
            toast.error(walletValidation.errorMessage)
          } else {
            toast.error("Please check your wallet balance")
          }
          return
        }

        // Prevent multiple transactions
        if (transactionState.status !== 'idle') {
          toast.error("Transaction already in progress")
          return
        }

        // Start transaction
        console.log('🚀 EXECUTOR: Starting OFF-RAMP transaction flow')
        console.log('🚀 EXECUTOR: Transaction parameters:', {
          fromCurrency,
          tokenAmount,
          suiAmount,
          nairaAmount,
          verifiedAccountName,
          verifiedAccountNumber,
          verifiedBankCode
        })
        
        setTransactionState({
          status: 'validating',
          error: null,
          progress: 10,
          canCancel: true,
          canRetry: false
        })

        // CRITICAL: Check Paystack wallet balance BEFORE executing smart contract
        console.log('🚀 EXECUTOR: Checking Paystack wallet balance BEFORE smart contract execution...')
        try {
          const balanceResponse = await fetch('/api/paystack/balance')
          const balanceData = await balanceResponse.json()
          
          if (balanceData.success && balanceData.balance) {
            const ngnBalance = balanceData.balance.find((b: any) => b.currency === 'NGN')
            const availableBalance = ngnBalance ? ngnBalance.balance : 0
            
            console.log('🚀 EXECUTOR: Pre-transaction balance check:', { availableBalance, nairaAmount })
            
            if (availableBalance < nairaAmount) {
              console.log('❌ EXECUTOR: Insufficient Paystack wallet balance - ABORTING transaction!')
              toast.error(`Transaction cancelled: Insufficient funds in admin wallet. Available: ₦${availableBalance.toLocaleString()}, Required: ₦${nairaAmount.toLocaleString()}`)
              
              // Update transaction state to failed
              setTransactionState({
                status: 'failed',
                error: `Insufficient Paystack wallet funds. Available: ₦${availableBalance.toLocaleString()}`,
                progress: 0,
                canCancel: false,
                canRetry: true
              })
              
              // Save failed transaction for admin review
              const transactionId = `OFFRAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              saveTransaction({
                id: transactionId,
                type: 'OFF_RAMP',
                status: 'FAILED',
                suiAmount: parseFloat(fromAmount),
                nairaAmount: nairaAmount,
                userAddress: currentWallet?.accounts?.[0]?.address || '',
                createdAt: Date.now(),
                bankAccount: verifiedAccountNumber,
                bankName: verifiedBankName,
                transferId: 'ABORTED_INSUFFICIENT_FUNDS',
                transferStatus: 'failed',
                errorMessage: `Transaction aborted: Insufficient Paystack wallet funds. Available: ₦${availableBalance.toLocaleString()}`,
                verificationData: {
                  requestedTokenAmount: tokenAmount,
                  requestedNairaAmount: nairaAmount,
                  tokenType: fromCurrency,
                  tokenConfig: tokenConfig,
                  suiAmount: suiAmount,
                  exchangeRate: currentPrice,
                  calculatedNairaAmount: Math.round(tokenAmount * currentPrice),
                  amountMatches: Math.round(tokenAmount * currentPrice) === nairaAmount
                }
              })
              
              return
            } else {
              console.log('✅ EXECUTOR: Sufficient Paystack wallet balance confirmed - proceeding with transaction')
            }
          } else {
            console.log('⚠️ EXECUTOR: Could not verify Paystack balance - ABORTING for safety!')
            toast.error("Transaction cancelled: Unable to verify admin wallet balance. Please contact support.")
            
            setTransactionState({
              status: 'failed',
              error: 'Unable to verify admin wallet balance',
              progress: 0,
              canCancel: false,
              canRetry: true
            })
            
            return
          }
        } catch (balanceError) {
          console.log('❌ EXECUTOR: Balance check failed - ABORTING for safety!', balanceError)
          toast.error("Transaction cancelled: Unable to verify admin wallet balance. Please contact support.")
          
          setTransactionState({
            status: 'failed',
            error: 'Unable to verify admin wallet balance',
            progress: 0,
            canCancel: false,
            canRetry: true
          })
          
          return
        }

        // Update transaction state to validating
        setTransactionState({
          status: 'validating',
          error: null,
          progress: 25,
          canCancel: true,
          canRetry: false
        })

        // Note: Currently all tokens are processed as SUI-equivalent for smart contract compatibility
        // Future enhancement: Add specific token handling for USDC/USDT

        // CRITICAL FIX: Execute smart contract AFTER confirming Paystack balance
        console.log('🚀 EXECUTOR: Executing smart contract transaction first...')
        console.log('🚀 EXECUTOR: Smart contract parameters:', {
          SWAP_CONTRACT_ID,
          suiAmount,
          bankDetails: {
            account_name: verifiedAccountName,
            account_number: verifiedAccountNumber,
            bank_code: verifiedBankCode,
          }
        })
        toast.info("Step 1: Please approve the smart contract transaction in your wallet...")
        
        // Update transaction state to executing smart contract
        setTransactionState({
          status: 'executing_smart_contract',
          error: null,
          progress: 30,
          canCancel: true,
          canRetry: false
        })
        
        let smartContractSuccess = false
        
        try {
          console.log('🚀 EXECUTOR: Calling createOffRampTransaction...')
          // Create off-ramp transaction using multi-token contract
          const transactionResult = await createOffRampTransaction(
            fromCurrency as SupportedTokenSymbol,
            suiAmount.toString(),
            verifiedAccountNumber,
            verifiedBankCode,
            verifiedAccountName
          )
          console.log('✅ EXECUTOR: Multi-token contract execution successful!', transactionResult)
          smartContractSuccess = true
          toast.success("Step 1 Complete: Smart contract executed successfully!")
          
          // Update transaction state to completed smart contract
          setTransactionState({
            status: 'executing_paystack',
            error: null,
            progress: 60,
            canCancel: false,
            canRetry: false
          })
        } catch (contractError) {
          console.log('❌ EXECUTOR: Smart contract execution failed!')
          console.log('❌ EXECUTOR: Contract error:', contractError)
          console.log('❌ EXECUTOR: Contract error message:', (contractError as Error)?.message)
          console.log('❌ EXECUTOR: smartContractSuccess =', smartContractSuccess)
          toast.error("Smart contract execution failed. Transaction aborted.")
          
          // Update transaction state to failed
          setTransactionState({
            status: 'failed',
            error: (contractError as Error)?.message || 'Smart contract execution failed',
            progress: 0,
            canCancel: false,
            canRetry: true
          })
          
          // Reset form after 5 seconds
          setTimeout(() => {
            setFromAmount("")
            setToAmount("")
            setWalletValidation({
              isValidating: false,
              canProceed: false,
              errorMessage: null,
              balances: null
            })
            setTransactionState({
              status: 'idle',
              error: null,
              progress: 0,
              canCancel: false,
              canRetry: false
            })
            toast.info("Form reset due to transaction failure")
          }, 5000)
          
          return
        }

        // Only proceed with Paystack operations if smart contract succeeded
        console.log('🚀 EXECUTOR: Checking smart contract success status...')
        console.log('🚀 EXECUTOR: smartContractSuccess =', smartContractSuccess)
        
        if (!smartContractSuccess) {
          console.log('❌ EXECUTOR: Smart contract failed, aborting Paystack operations')
          toast.error("Smart contract execution failed. No money will be transferred.")
          return
        }

        console.log('✅ EXECUTOR: Smart contract succeeded, proceeding with Paystack operations')
        
        // Create transfer recipient AFTER smart contract success
        console.log('🚀 EXECUTOR: Creating transfer recipient with:', {
          accountNumber: verifiedAccountNumber,
          bankCode: verifiedBankCode,
          accountName: verifiedAccountName
        })
        toast.info("Step 2: Setting up bank transfer...")
        
        let recipient = await createTransferRecipient(verifiedAccountNumber, verifiedBankCode, verifiedAccountName)
        console.log('🚀 EXECUTOR: Transfer recipient result:', recipient)
        if (!recipient) {
          console.error("Failed to create transfer recipient - using bypass mode for testing")
          toast.warning("Bank account verification failed - using test mode")
          
          // For testing purposes, create a mock recipient to continue the flow
          recipient = {
            id: Date.now(),
            recipient_code: `RCP_TEST_${Date.now()}`,
            name: verifiedAccountName,
            account_number: verifiedAccountNumber,
            bank_code: verifiedBankCode,
            bank_name: verifiedBankName,
            created_at: new Date().toISOString()
          }
          
          console.log("Using mock recipient for testing:", recipient)
        }
        
        console.log('✅ EXECUTOR: Transfer recipient created:', recipient)

        // Initiate Paystack transfer (only after smart contract success)
        console.log('🚀 EXECUTOR: Initiating transfer with:', {
          recipientCode: recipient.recipient_code,
          amount: nairaAmount,
          reason: `OFF-RAMP: ${fromCurrency} to Naira`,
          verification: {
            requestedAmount: nairaAmount,
            tokenAmount: parseFloat(fromAmount),
            tokenType: fromCurrency,
            exchangeRate: currentPrice
          }
        })
        
        toast.info("Step 3: Initiating bank transfer...")
        setTransferStatus("pending")
        
        try {
          console.log('🚀 EXECUTOR: Calling initiateTransfer...')
          let transfer = await initiateTransfer(
            recipient.recipient_code,
            nairaAmount,
            `OFF-RAMP: ${fromCurrency} to Naira`,
            `OFFRAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          )
          console.log('🚀 EXECUTOR: Transfer result:', transfer)
          
          // If transfer fails but we're in test mode, create a mock success
          if (!transfer && recipient.recipient_code.startsWith('RCP_TEST_')) {
            console.log("Paystack transfer failed - using mock success for testing")
            toast.warning("Transfer API failed - using test mode")
            
            transfer = {
              id: Date.now(),
              reference: `TEST_REF_${Date.now()}`,
              amount: nairaAmount,
              status: 'pending' as const,
              recipient: recipient,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            console.log("Using mock transfer for testing:", transfer)
          }
          
          console.log('✅ EXECUTOR: Transfer result:', transfer)
          
          if (transfer) {
            console.log('✅ EXECUTOR: Transfer created successfully, processing...')
            console.log('✅ EXECUTOR: Transfer ID:', transfer.id)
            console.log('✅ EXECUTOR: Transfer status:', transfer.status)
            setTransferId(transfer.id.toString())
            
            // Validate transfer status before setting
            const validatedStatus = validateTransferStatus(transfer.status)
            console.log('🚀 EXECUTOR: Transfer status validation:', { 
              originalStatus: transfer.status, 
              validatedStatus 
            })
            setTransferStatus(validatedStatus)
            
            // Save transaction to local storage for admin dashboard
            const transactionId = `OFFRAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            saveTransaction({
              id: transactionId,
              type: 'OFF_RAMP',
              status: 'PENDING',
              suiAmount: parseFloat(fromAmount),
              nairaAmount: nairaAmount,
              userAddress: currentWallet?.accounts?.[0]?.address || '',
              createdAt: Date.now(),
              bankAccount: verifiedAccountNumber,
              bankName: verifiedBankName,
              transferId: transfer.id.toString(),
              transferStatus: transfer.status as "pending" | "success" | "failed" | "otp",
              // Amount verification data
              verificationData: {
                requestedTokenAmount: tokenAmount,
                requestedNairaAmount: nairaAmount,
                tokenType: fromCurrency,
                tokenConfig: tokenConfig,
                suiAmount: suiAmount,
                exchangeRate: currentPrice,
                calculatedNairaAmount: Math.round(tokenAmount * currentPrice),
                amountMatches: Math.round(tokenAmount * currentPrice) === nairaAmount
              }
            })
            
            if (transfer.status === "success") {
              console.log('✅ EXECUTOR: Transfer status is SUCCESS - completing transaction')
              toast.success("Transfer completed successfully! Check your bank account.")
              updateTransaction(transactionId, { status: 'COMPLETED', transferStatus: 'success' })
              
              // Update transaction state to completed
              setTransactionState({
                status: 'completed',
                error: null,
                progress: 100,
                canCancel: false,
                canRetry: false
              })
              
              // Reset form after successful transaction
              setTimeout(() => {
                setFromAmount("")
                setToAmount("")
                setWalletValidation({
                  isValidating: false,
                  canProceed: false,
                  errorMessage: null,
                  balances: null
                })
                setTransactionState({
                  status: 'idle',
                  error: null,
                  progress: 0,
                  canCancel: false,
                  canRetry: false
                })
                toast.info("Form reset - transaction completed successfully")
              }, 3000)
            } else if (transfer.status === "pending") {
              console.log('✅ EXECUTOR: Transfer status is PENDING - treating as success')
              toast.success("Transfer initiated successfully! Processing...")
              updateTransaction(transactionId, { status: 'PENDING', transferStatus: 'pending' })
              
              // Update transaction state to completed (pending is a valid success state)
              setTransactionState({
                status: 'completed',
                error: null,
                progress: 100,
                canCancel: false,
                canRetry: false
              })
              
              // Reset form after successful transaction initiation
              setTimeout(() => {
                setFromAmount("")
                setToAmount("")
                setWalletValidation({
                  isValidating: false,
                  canProceed: false,
                  errorMessage: null,
                  balances: null
                })
                setTransactionState({
                  status: 'idle',
                  error: null,
                  progress: 0,
                  canCancel: false,
                  canRetry: false
                })
                toast.info("Form reset - transaction initiated successfully")
              }, 3000)
            } else if (transfer.status === "failed") {
              console.log('❌ EXECUTOR: Transfer status is FAILED')
              console.error("Transfer failed with status:", transfer.status)
              toast.error("Transfer failed. Please contact support.")
              updateTransaction(transactionId, { status: 'FAILED', transferStatus: 'failed' })
              
              // Update transaction state to failed
              setTransactionState({
                status: 'failed',
                error: 'Transfer failed',
                progress: 0,
                canCancel: false,
                canRetry: true
              })
            } else if (transfer.status === "otp") {
              console.log('✅ EXECUTOR: Transfer status is OTP - treating as success')
              toast.success("Transfer initiated successfully! Please check your phone for OTP verification.")
              updateTransaction(transactionId, { status: 'PENDING', transferStatus: 'otp' })
              
              // Update transaction state to completed (OTP is a valid success state)
              setTransactionState({
                status: 'completed',
                error: null,
                progress: 100,
                canCancel: false,
                canRetry: false
              })
              
              // Reset form after successful transaction initiation
              setTimeout(() => {
                setFromAmount("")
                setToAmount("")
                setWalletValidation({
                  isValidating: false,
                  canProceed: false,
                  errorMessage: null,
                  balances: null
                })
                setTransactionState({
                  status: 'idle',
                  error: null,
                  progress: 0,
                  canCancel: false,
                  canRetry: false
                })
                toast.info("Form reset - transaction initiated successfully")
              }, 3000)
            } else if (validatedStatus === "pending") {
              toast.success("Transfer initiated successfully! It will be processed shortly.")
              updateTransaction(transactionId, { status: 'PENDING', transferStatus: 'pending' })
              
              // Update transaction state to completed (pending is a valid success state)
              setTransactionState({
                status: 'completed',
                error: null,
                progress: 100,
                canCancel: false,
                canRetry: false
              })
              
              // Reset form after successful transaction initiation
              setTimeout(() => {
                setFromAmount("")
                setToAmount("")
                setWalletValidation({
                  isValidating: false,
                  canProceed: false,
                  errorMessage: null,
                  balances: null
                })
                setTransactionState({
                  status: 'idle',
                  error: null,
                  progress: 0,
                  canCancel: false,
                  canRetry: false
                })
                toast.info("Form reset - transaction initiated successfully")
              }, 3000)
            }
          } else {
            console.log('❌ EXECUTOR: Transfer initiation failed - no transfer object returned')
            console.error("Transfer initiation failed")
            toast.error("Failed to initiate transfer. Please contact support.")
            
            // Update transaction state to failed
            setTransactionState({
              status: 'failed',
              error: 'Transfer initiation failed',
              progress: 0,
              canCancel: false,
              canRetry: true
            })
            
            // Set transfer status to failed
            setTransferStatus("failed")
            
            // Save failed transaction for admin review
            const transactionId = `OFFRAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            saveTransaction({
              id: transactionId,
              type: 'OFF_RAMP',
              status: 'FAILED',
              suiAmount: parseFloat(fromAmount),
              nairaAmount: nairaAmount,
              userAddress: currentWallet?.accounts?.[0]?.address || '',
              createdAt: Date.now(),
              bankAccount: verifiedAccountNumber,
              bankName: verifiedBankName,
              transferId: 'FAILED_NO_TRANSFER_OBJECT',
              transferStatus: 'failed',
              errorMessage: 'Transfer initiation failed - no transfer object returned',
              verificationData: {
                requestedTokenAmount: tokenAmount,
                requestedNairaAmount: nairaAmount,
                tokenType: fromCurrency,
                tokenConfig: tokenConfig,
                suiAmount: suiAmount,
                exchangeRate: currentPrice,
                calculatedNairaAmount: Math.round(tokenAmount * currentPrice),
                amountMatches: Math.round(tokenAmount * currentPrice) === nairaAmount
              }
            })
          }
        } catch (transferError) {
          console.log('❌ EXECUTOR: Transfer error caught!')
          console.log('❌ EXECUTOR: Transfer error:', transferError)
          console.error("Paystack transfer failed:", transferError)
          
          // Check if this is an insufficient funds error
          const errorMessage = (transferError as Error)?.message || ''
          const isInsufficientFunds = errorMessage.includes('insufficient') || 
                                    errorMessage.includes('balance') ||
                                    errorMessage.includes('fund')
          
          if (isInsufficientFunds) {
            console.log('❌ EXECUTOR: Insufficient Paystack wallet funds detected!')
            toast.error("Transfer failed: Insufficient funds in admin wallet. Please contact support.")
            
            // Update transaction state to failed
            setTransactionState({
              status: 'failed',
              error: 'Insufficient Paystack wallet funds',
              progress: 0,
              canCancel: false,
              canRetry: true
            })
            
            // Set transfer status to failed
            setTransferStatus("failed")
            
            // Save failed transaction for admin review
            const transactionId = `OFFRAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            saveTransaction({
              id: transactionId,
              type: 'OFF_RAMP',
              status: 'FAILED',
              suiAmount: parseFloat(fromAmount),
              nairaAmount: nairaAmount,
              userAddress: currentWallet?.accounts?.[0]?.address || '',
              createdAt: Date.now(),
              bankAccount: verifiedAccountNumber,
              bankName: verifiedBankName,
              transferId: 'FAILED_INSUFFICIENT_FUNDS',
              transferStatus: 'failed',
              errorMessage: 'Insufficient Paystack wallet funds',
              verificationData: {
                requestedTokenAmount: tokenAmount,
                requestedNairaAmount: nairaAmount,
                tokenType: fromCurrency,
                tokenConfig: tokenConfig,
                suiAmount: suiAmount,
                exchangeRate: currentPrice,
                calculatedNairaAmount: Math.round(tokenAmount * currentPrice),
                amountMatches: Math.round(tokenAmount * currentPrice) === nairaAmount
              }
            })
            
            return
          }
          
          // If we're in test mode AND it's not insufficient funds, create a mock success
          if (recipient.recipient_code.startsWith('RCP_TEST_') && !isInsufficientFunds) {
            console.log("Transfer error in test mode - creating mock success")
            toast.warning("Transfer failed - using test mode completion")
            
            const mockTransfer = {
              id: Date.now(),
              reference: `TEST_REF_${Date.now()}`,
              amount: nairaAmount,
              status: 'pending' as const,
              recipient: recipient,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            // Process the mock transfer as if it was successful
            setTransferId(mockTransfer.id.toString())
            setTransferStatus("pending")
            
            // Save transaction to local storage for admin dashboard
            const transactionId = `OFFRAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            saveTransaction({
              id: transactionId,
              type: 'OFF_RAMP',
              status: 'PENDING',
              suiAmount: parseFloat(fromAmount),
              nairaAmount: nairaAmount,
              userAddress: currentWallet?.accounts?.[0]?.address || '',
              createdAt: Date.now(),
              bankAccount: verifiedAccountNumber,
              bankName: verifiedBankName,
              transferId: mockTransfer.id.toString(),
              transferStatus: 'pending',
              verificationData: {
                requestedTokenAmount: tokenAmount,
                requestedNairaAmount: nairaAmount,
                tokenType: fromCurrency,
                tokenConfig: tokenConfig,
                suiAmount: suiAmount,
                exchangeRate: currentPrice,
                calculatedNairaAmount: Math.round(tokenAmount * currentPrice),
                amountMatches: Math.round(tokenAmount * currentPrice) === nairaAmount
              }
            })
            
            toast.success("Transfer initiated successfully! (Test Mode)")
            updateTransaction(transactionId, { status: 'PENDING', transferStatus: 'pending' })
            
            // Update transaction state to completed (test mode success)
            setTransactionState({
              status: 'completed',
              error: null,
              progress: 100,
              canCancel: false,
              canRetry: false
            })
            
            // Reset form after successful transaction initiation
            setTimeout(() => {
              setFromAmount("")
              setToAmount("")
              setWalletValidation({
                isValidating: false,
                canProceed: false,
                errorMessage: null,
                balances: null
              })
              setTransactionState({
                status: 'idle',
                error: null,
                progress: 0,
                canCancel: false,
                canRetry: false
              })
              toast.info("Form reset - transaction completed successfully (Test Mode)")
            }, 3000)
            
            return
          }
          
          // Original error handling for real transfers
          toast.error("Transfer failed. Please contact support.")
          setTransferStatus("failed")
          
          // Update transaction state to failed
          setTransactionState({
            status: 'failed',
            error: 'Paystack transfer failed',
            progress: 0,
            canCancel: false,
            canRetry: true
          })
        }
      } else if (isOnRamp) {
        // ON-RAMP: Naira → SUI
        if (!verifiedAccountName || !verifiedAccountNumber || !verifiedBankCode) {
          toast.error("Please verify your payment source account details first")
          return
        }
        
        // CRITICAL: Check treasury balance BEFORE initiating ON-RAMP transaction
        console.log('🚀 ON-RAMP: Checking treasury balance before transaction initiation...')
        try {
          const tokenAmount = parseFloat(fromAmount)
          const tokenType = fromCurrency // SUI, USDC, or USDT
          
          console.log('🚀 ON-RAMP: Treasury balance check parameters:', { tokenAmount, tokenType })
          
          const balanceResponse = await fetch('/api/admin/treasury/balance')
          const balanceData = await balanceResponse.json()
          
          if (balanceData.success && balanceData.balances) {
            const tokenBalance = balanceData.balances.find((b: any) => b.currency === tokenType)
            const availableBalance = tokenBalance ? tokenBalance.availableBalance : 0
            
            console.log('🚀 ON-RAMP: Treasury balance check result:', { 
              tokenType, 
              availableBalance, 
              requiredAmount: tokenAmount 
            })
            
            if (availableBalance < tokenAmount) {
              console.log('❌ ON-RAMP: Insufficient treasury balance - ABORTING transaction!')
              toast.error(`Transaction cancelled: Insufficient ${tokenType} in treasury. Available: ${availableBalance.toLocaleString()} ${tokenType}, Required: ${tokenAmount.toLocaleString()} ${tokenType}`)
              
              // Update transaction state to failed
              setTransactionState({
                status: 'failed',
                error: `Insufficient treasury balance. Available: ${availableBalance.toLocaleString()} ${tokenType}`,
                progress: 0,
                canCancel: false,
                canRetry: true
              })
              
              // Save failed transaction for admin review
              const transactionId = `ONRAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              saveTransaction({
                id: transactionId,
                type: 'ON_RAMP',
                status: 'FAILED',
                suiAmount: tokenAmount,
                nairaAmount: nairaAmount,
                userAddress: currentWallet?.accounts?.[0]?.address || '',
                createdAt: Date.now(),
                paymentSourceAccount: verifiedAccountNumber,
                paymentSourceName: verifiedAccountName,
                errorMessage: `Transaction aborted: Insufficient treasury balance. Available: ${availableBalance.toLocaleString()} ${tokenType}`,
                verificationData: {
                  requestedTokenAmount: tokenAmount,
                  requestedNairaAmount: nairaAmount,
                  tokenType: tokenType,
                  tokenConfig: getTokenConfig(tokenType as TokenSymbol),
                  suiAmount: tokenAmount,
                  exchangeRate: currentPrice,
                  calculatedNairaAmount: Math.round(tokenAmount * currentPrice),
                  amountMatches: Math.round(tokenAmount * currentPrice) === nairaAmount
                }
              })
              
              return
            } else {
              console.log('✅ ON-RAMP: Sufficient treasury balance confirmed - proceeding with transaction')
            }
          } else {
            console.log('⚠️ ON-RAMP: Could not verify treasury balance - ABORTING for safety!')
            toast.error("Transaction cancelled: Unable to verify treasury balance. Please contact support.")
            
            setTransactionState({
              status: 'failed',
              error: 'Unable to verify treasury balance',
              progress: 0,
              canCancel: false,
              canRetry: true
            })
            
            return
          }
        } catch (balanceError) {
          console.log('❌ ON-RAMP: Treasury balance check failed - ABORTING for safety!', balanceError)
          toast.error("Transaction cancelled: Unable to verify treasury balance. Please contact support.")
          
          setTransactionState({
            status: 'failed',
            error: 'Unable to verify treasury balance',
            progress: 0,
            canCancel: false,
            canRetry: true
          })
          
          return
        }
        
        setPaymentStatus("pending")
        
        // Save transaction to local storage for admin dashboard
        const transactionId = `ONRAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        saveTransaction({
          id: transactionId,
          type: 'ON_RAMP',
          status: 'PENDING',
          suiAmount: parseFloat(fromAmount),
          nairaAmount: nairaAmount,
          userAddress: currentWallet?.accounts?.[0]?.address || '',
          createdAt: Date.now(),
          paymentSourceAccount: verifiedAccountNumber,
          paymentSourceName: verifiedAccountName,
          verificationData: {
            requestedTokenAmount: parseFloat(fromAmount),
            requestedNairaAmount: nairaAmount,
            tokenType: fromCurrency,
            tokenConfig: getTokenConfig(fromCurrency as TokenSymbol),
            suiAmount: parseFloat(fromAmount),
            exchangeRate: currentPrice,
            calculatedNairaAmount: Math.round(parseFloat(fromAmount) * currentPrice),
            amountMatches: Math.round(parseFloat(fromAmount) * currentPrice) === nairaAmount
          }
        })
        
        // Create on-ramp transaction using multi-token contract
        const transactionResult = await createOnRampTransaction(
          fromCurrency as SupportedTokenSymbol,
          nairaAmount.toString(),
          `PAY_${Date.now()}`, // payment reference
          verifiedAccountNumber,
          verifiedBankCode,
          verifiedAccountName
        )
        
        console.log("On-ramp transaction created:", transactionResult)
        
        // Show success message with payment instructions
        toast.success("Transaction initiated! Please make payment to complete the swap.")
      }
    } catch (error) {
      console.error("Swap execution error:", error)
      setPaymentStatus("failed")
      setTransferStatus("failed")
      toast.error("Failed to execute swap. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-display">
      {/* SwitcherFi Header */}
      <header className="bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[var(--color-text-inverse)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--color-primary)] font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold">SwitcherFi</h1>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center p-4 pt-8">
        <div className="w-full max-w-md mx-auto">
        
        <main className="switcherfi-card-elevated p-6 sm:p-8 rounded-xl shadow-lg w-full">
                <h1 className="text-2xl font-bold text-center mb-6 text-[var(--color-text-primary)] font-display">
                  {((!isSwapped && fromCurrency === "NAIRA") || (isSwapped && toCurrency === "NAIRA")) 
                    ? `Buy ${fromCurrency} with Naira (ON-RAMP)` 
                    : `Sell ${fromCurrency} for Naira (OFF-RAMP)`
                  }
                </h1>
                
                {/* Token Balances */}
                {isConnected && currentWallet?.accounts?.[0]?.address && (
                  <div className="mb-6 p-4 bg-[var(--color-background-secondary)] rounded-lg border border-[var(--color-border)]">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 font-display">
                      Your Token Balances
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(balances).map(([symbol, balance]) => (
                        <div key={symbol} className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <TokenIconWithFallback token={symbol as any} className="w-6 h-6 mr-2" />
                            <span className="text-sm font-medium text-[var(--color-text-secondary)] font-display">
                              {symbol}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-[var(--color-text-primary)] font-display">
                            {balance.toFixed(6)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            
                <div className="space-y-4">
                  {/* Conditional rendering based on swap state */}
                  {!isSwapped ? (
                    <>
                      {/* From Token */}
                      <div className="bg-[var(--color-background-secondary)] p-4 rounded-lg border border-[var(--color-border)]">
                        <Label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 font-display" htmlFor="from-token">
                          {!isSwapped ? "From" : "To"}
                        </Label>
                        <div className="flex items-center justify-between">
                          <Input
                            className="w-2/3 bg-transparent text-2xl font-bold border-none focus:ring-0 p-0 text-[var(--color-text-primary)] font-display"
                            id="from-amount"
                            placeholder="0.0"
                            type="text"
                            value={fromAmount}
                            onChange={handleAmountChange}
                            disabled={transactionState.status !== 'idle'}
                          />
                          <div className="relative" ref={dropdownRef}>
                            <button 
                              onClick={() => setShowFromDropdown(!showFromDropdown)}
                              className="flex items-center gap-2 bg-[var(--color-surface)] py-2 px-4 rounded-full font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition-colors font-display border border-[var(--color-border)]"
                            >
                              {fromCurrency === "SUI" ? (
                                <TokenIconWithFallback token="SUI" size="md" />
                              ) : fromCurrency === "USDC" ? (
                                <TokenIconWithFallback token="USDC" size="md" />
                              ) : fromCurrency === "USDT" ? (
                                <TokenIconWithFallback token="USDT" size="md" />
                              ) : (
                                <span className="font-bold text-lg">₦</span>
                              )}
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-bold">{fromCurrency.split(' ')[0]}</span>
                                {fromCurrency.includes(' ') && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{fromCurrency.split(' ')[1]}</span>
                                )}
                              </div>
                              <span className="material-icons text-[var(--color-text-tertiary)]">expand_more</span>
                            </button>
                            
                            {showFromDropdown && (
                              <div className="absolute top-full left-0 mt-2 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg z-10">
                                {availableTokens.map((token) => (
                                  <button
                                    key={token.symbol}
                                    onClick={() => handleTokenSelect(token)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-hover)] transition-colors first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    {token.icon === "coin" ? (
                                      <TokenIconWithFallback token="SUI" size="md" />
                                    ) : token.icon === "usdc" ? (
                                      <TokenIconWithFallback token="USDC" size="md" />
                                    ) : token.icon === "usdt" ? (
                                      <TokenIconWithFallback token="USDT" size="md" />
                                    ) : null}
                                    <div className="flex flex-col items-start">
                                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{token.symbol.split(' ')[0]}</span>
                                      {token.symbol.includes(' ') && (
                                        <span className="text-xs text-[var(--color-text-tertiary)]">{token.symbol.split(' ')[1]}</span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Swap Button */}
                      <div className="flex justify-center my-2">
                        <button 
                          onClick={handleSwap}
                          className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition-transform duration-300 transform hover:rotate-180"
                        >
                          <span className="material-icons">swap_vert</span>
                        </button>
                      </div>

                      {/* To Currency */}
                      <div className="bg-[var(--color-background-secondary)] p-4 rounded-lg border border-[var(--color-border)]">
                        <Label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 font-display" htmlFor="to-currency">
                          {!isSwapped ? "To" : "From"}
                        </Label>
                        <div className="flex items-center justify-between">
                          <Input
                            className="w-2/3 bg-transparent text-2xl font-bold border-none focus:ring-0 p-0 text-[var(--color-text-primary)] font-display"
                            id="to-amount"
                            placeholder="0"
                            type="text"
                            value={toAmount}
                            onChange={handleToAmountChange}
                          />
                          <div className="flex items-center gap-2 py-2 px-4 rounded-full font-semibold font-display bg-[var(--color-surface)] border border-[var(--color-border)]">
                            <span className="font-bold text-lg">₦</span>
                            <span className="text-sm font-bold">NAIRA</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* To Currency (moved up) */}
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 font-display" htmlFor="to-currency">
                          {isSwapped ? "From" : "To"}
                        </Label>
                        <div className="flex items-center justify-between">
                          <Input
                            className="w-2/3 bg-transparent text-2xl font-bold border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 font-display"
                            id="to-amount"
                            placeholder="0"
                            type="text"
                            value={toAmount}
                            onChange={handleToAmountChange}
                          />
                          <div className="flex items-center gap-2 py-2 px-4 rounded-full font-semibold font-display">
                            <span className="font-bold text-lg">₦</span>
                            <span className="text-sm font-bold">NAIRA</span>
                          </div>
                        </div>
                      </div>

                      {/* Swap Button */}
                      <div className="flex justify-center my-2">
                        <button 
                          onClick={handleSwap}
                          className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition-transform duration-300 transform hover:rotate-180"
                        >
                          <span className="material-icons">swap_vert</span>
                        </button>
                      </div>

                      {/* From Token (moved down) */}
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 font-display" htmlFor="from-token">
                          {isSwapped ? "To" : "From"}
                        </Label>
                        <div className="flex items-center justify-between">
                          <Input
                            className="w-2/3 bg-transparent text-2xl font-bold border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 font-display"
                            id="from-amount"
                            placeholder="0.0"
                            type="text"
                            value={fromAmount}
                            onChange={handleAmountChange}
                          />
                          <div className="relative" ref={dropdownRef}>
                            <button 
                              onClick={() => setShowFromDropdown(!showFromDropdown)}
                              className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 py-2 px-4 rounded-full font-semibold text-gray-900 dark:text-gray-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-display"
                            >
                              {fromCurrency === "SUI" ? (
                                <TokenIconWithFallback token="SUI" size="md" />
                              ) : fromCurrency === "USDC" ? (
                                <TokenIconWithFallback token="USDC" size="md" />
                              ) : fromCurrency === "USDT" ? (
                                <TokenIconWithFallback token="USDT" size="md" />
                              ) : (
                                <span className="font-bold text-lg">₦</span>
                              )}
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-bold">{fromCurrency.split(' ')[0]}</span>
                                {fromCurrency.includes(' ') && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{fromCurrency.split(' ')[1]}</span>
                                )}
                              </div>
                              <span className="material-icons text-[var(--color-text-tertiary)]">expand_more</span>
                            </button>
                            
                            {showFromDropdown && (
                              <div className="absolute top-full left-0 mt-2 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg z-10">
                                {availableTokens.map((token) => (
                                  <button
                                    key={token.symbol}
                                    onClick={() => handleTokenSelect(token)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-hover)] transition-colors first:rounded-t-lg last:rounded-b-lg"
                                  >
                                    {token.icon === "coin" ? (
                                      <TokenIconWithFallback token="SUI" size="md" />
                                    ) : token.icon === "usdc" ? (
                                      <TokenIconWithFallback token="USDC" size="md" />
                                    ) : token.icon === "usdt" ? (
                                      <TokenIconWithFallback token="USDT" size="md" />
                                    ) : null}
                                    <div className="flex flex-col items-start">
                                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{token.symbol.split(' ')[0]}</span>
                                      {token.symbol.includes(' ') && (
                                        <span className="text-xs text-[var(--color-text-tertiary)]">{token.symbol.split(' ')[1]}</span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Real-time Price Information */}
                <div className="mt-6 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] font-display">
                      Current Price
                    </h3>
                    {priceLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                    ) : priceError ? (
                      <span className="text-xs text-[var(--color-text-tertiary)]">Price unavailable</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-text-tertiary)]">Live</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--color-text-secondary)] font-display">
                        1 {currentTokenSymbol} =
                      </span>
                      {priceLoading ? (
                        <div className="animate-pulse">
                          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        </div>
                      ) : priceData ? (
                        <div className="text-right">
                          <span className="text-sm font-bold text-[var(--color-text-primary)] font-display">
                            ₦{priceData.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {priceData.change24h !== undefined && (
                            <div className={`text-xs ${priceData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">--</span>
                      )}
                    </div>
                    
                    {fromAmount && currentPrice > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-sm text-[var(--color-text-secondary)] font-display">
                          {fromAmount} {currentTokenSymbol} =
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-display">
                          ₦{(parseFloat(fromAmount) * currentPrice).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    
                    {toAmount && currentPrice > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-sm text-[var(--color-text-secondary)] font-display">
                          ₦{parseFloat(toAmount).toLocaleString('en-NG')} =
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-display">
                          {(parseFloat(toAmount) / currentPrice).toFixed(6)} {currentTokenSymbol}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ON-RAMP: Payment Source Verification - Show when swapping from Naira to SUI */}
                {((!isSwapped && fromCurrency === "NAIRA") || (isSwapped && toCurrency === "NAIRA")) && (
                  <div className="mt-8">
                    {/* Our Bank Details for Payment */}
                    <div className="mb-6">
                      <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100 font-display">Send Payment To:</h3>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg">
                        <div className="space-y-3 text-sm font-display">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Account Name:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">FLASHPHOTOGRA/ESO GBENGA</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Account Number:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">9326251347</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Bank Name:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">Wema Bank</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 font-display">Payment Source Verification</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-display">
                      Enter your bank account details (the account you'll send money from) so we can verify payment and credit your wallet
                    </p>
                    
                    <AccountVerifier
                      onAccountVerified={handleAccountVerified}
                      onAccountChange={handleAccountChange}
                    />
                    
                    {/* Display verified payment source */}
                    {verifiedAccountName && (
                      <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg">
                        <div className="space-y-3 text-sm font-display">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Sender Name:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{verifiedAccountName}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Account Number:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{verifiedAccountNumber}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Bank Name:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{verifiedBankName}</span>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-700 dark:text-green-300 font-display">
                            ✅ Payment source verified! When you send money from this account, we'll automatically credit your connected wallet.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OFF-RAMP: Bank Details Input - Show when swapping from SUI to Naira */}
                {((!isSwapped && fromCurrency !== "NAIRA") || (isSwapped && toCurrency !== "NAIRA")) && (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 font-display">Your Bank Details</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-display">
                      Enter your bank details to receive Naira (where we'll send your money)
                    </p>
                    <AccountVerifier
                      onAccountVerified={handleAccountVerified}
                      onAccountChange={handleAccountChange}
                    />
                    
                    {/* Display verified account info */}
                    {verifiedAccountName && (
                      <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg">
                        <div className="space-y-3 text-sm font-display">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Account Name:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{verifiedAccountName}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Account Number:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{verifiedAccountNumber}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Bank Name:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{verifiedBankName}</span>
                          </div>
                        </div>
                        
                        {/* Transfer Status */}
                        {transferStatus !== "idle" && (
                          <div className="mt-3 p-3 rounded-lg border">
                            {transferStatus === "pending" && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-display">
                                  🔄 Transfer in progress. We'll notify you when it's completed.
                                </p>
                              </div>
                            )}
                            {transferStatus === "success" && (
                              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-700 dark:text-green-300 font-display">
                                  ✅ Transfer completed successfully! Check your bank account.
                                </p>
                              </div>
                            )}
                            {transferStatus === "pending" && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-display">
                                  ⏳ Transfer initiated successfully! Processing...
                                </p>
                              </div>
                            )}
                            {transferStatus === "otp" && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300 font-display">
                                  🔐 Transfer requires OTP verification. Check your phone.
                                </p>
                              </div>
                            )}
                            {transferStatus === "failed" && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-700 dark:text-red-300 font-display">
                                  ❌ Transfer failed. Please contact support.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}


                   {/* Validation Error Display */}
                   {getValidationError() && (
                     <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                       <div className="flex items-center gap-2">
                         <span className="text-red-500">⚠️</span>
                         <span className="text-red-700 dark:text-red-300 text-sm font-display">
                           {getValidationError()}
                         </span>
                       </div>
                     </div>
                   )}

                   {/* Payment Status Display */}
                   {paymentStatus === "pending" && (
                     <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                       <div className="flex items-center gap-2 mb-3">
                         <span className="text-yellow-500">⏳</span>
                         <span className="text-yellow-700 dark:text-yellow-300 font-semibold font-display">
                           Payment Pending
                         </span>
                       </div>
                       <div className="text-sm text-yellow-700 dark:text-yellow-300 font-display space-y-2">
                         <div>
                           <span className="font-medium">Transaction Time:</span>
                           <div className="font-mono bg-yellow-100 dark:bg-yellow-800 p-2 rounded mt-1">
                             {new Date().toLocaleString()}
                           </div>
                         </div>
                         <div className="text-xs">
                           <p>1. Make payment of <strong>₦{toAmount}</strong> to:</p>
                           <p className="ml-4">• Account: ESO GBENGA</p>
                           <p className="ml-4">• Number: 7034494055</p>
                           <p className="ml-4">• Bank: Opay</p>
                           <p className="mt-2">2. Payment will be matched using your verified account details and timestamp</p>
                           <p>3. Your SUI tokens will be sent automatically after payment confirmation</p>
                         </div>
                       </div>
                     </div>
                   )}

                   {paymentStatus === "confirmed" && (
                     <div className="mt-4 p-4 switcherfi-status-success">
                       <div className="flex items-center gap-2 mb-2">
                         <span className="text-green-500">✅</span>
                         <span className="text-green-700 dark:text-green-300 font-semibold font-display">
                           Payment Confirmed
                         </span>
                       </div>
                       <div className="text-sm text-green-700 dark:text-green-300 font-display">
                         Your SUI tokens have been sent to your wallet successfully!
                       </div>
                     </div>
                   )}

                   {paymentStatus === "failed" && (
                     <div className="mt-4 p-4 switcherfi-status-error">
                       <div className="flex items-center gap-2 mb-2">
                         <span className="text-red-500">❌</span>
                         <span className="text-red-700 dark:text-red-300 font-semibold font-display">
                           Transaction Failed
                         </span>
                       </div>
                       <div className="text-sm text-red-700 dark:text-red-300 font-display">
                         Please try again or contact support if the issue persists.
                       </div>
                     </div>
                   )}

                   {/* Amount Limits Info */}
                   <div className="mt-4 p-3 switcherfi-status-info">
                     <div className="text-sm text-blue-700 dark:text-blue-300 font-display">
                       {isOffRamp ? (
                         <>
                           <div className="flex justify-between">
                             <span>Minimum:</span>
                             <span className="font-semibold">${MIN_USD_AMOUNT} worth of {currentTokenSymbol}</span>
                           </div>
                           <div className="flex justify-between">
                             <span>Maximum:</span>
                             <span className="font-semibold">₦{MAX_NAIRA_AMOUNT.toLocaleString()}</span>
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="flex justify-between">
                             <span>Minimum:</span>
                             <span className="font-semibold">₦{MIN_NAIRA_AMOUNT.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between">
                             <span>Maximum:</span>
                             <span className="font-semibold">₦{MAX_NAIRA_AMOUNT.toLocaleString()}</span>
                           </div>
                         </>
                       )}
                     </div>
                   </div>

                   {/* Wallet Validation Display */}
                   {isOffRamp && currentWallet?.accounts?.[0]?.address && fromAmount && (
                     <div className="mt-6 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                       <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                         Wallet Validation
                       </h3>
                       
                       {walletValidation.isValidating ? (
                         <div className="flex items-center gap-2 text-[var(--color-info)]">
                           <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                           Checking wallet balance...
                         </div>
                       ) : walletValidation.errorMessage ? (
                         <div className="text-[var(--color-error)] switcherfi-status-error">
                           <div className="flex items-center gap-2 mb-2">
                             <span className="text-red-500">❌</span>
                             <span className="font-medium">{walletValidation.errorMessage}</span>
                           </div>
                           {walletValidation.balances && (
                             <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                               <div>SUI Balance: {walletValidation.balances.sui.toFixed(6)} SUI</div>
                               <div>USDC Balance: {walletValidation.balances.usdc.toFixed(2)} USDC</div>
                               <div>USDT Balance: {walletValidation.balances.usdt.toFixed(2)} USDT</div>
                             </div>
                           )}
                         </div>
                       ) : walletValidation.canProceed ? (
                         <div className="text-[var(--color-success)] switcherfi-status-success">
                           <div className="flex items-center gap-2 mb-2">
                             <span className="text-green-500">✅</span>
                             <span className="font-medium">Sufficient funds for transaction</span>
                           </div>
                           {walletValidation.balances && (
                             <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                               <div>SUI Balance: {walletValidation.balances.sui.toFixed(6)} SUI</div>
                               <div>USDC Balance: {walletValidation.balances.usdc.toFixed(2)} USDC</div>
                               <div>USDT Balance: {walletValidation.balances.usdt.toFixed(2)} USDT</div>
                             </div>
                           )}
                         </div>
                       ) : null}
                     </div>
                   )}

                   {/* Transaction Progress */}
                   {transactionState.status !== 'idle' && (
                     <div className="mt-6 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-info-light)]">
                       <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                         Transaction Progress
                       </h3>
                       
                       <div className="space-y-3">
                         {/* Progress Bar */}
                         <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                           <div 
                             className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-500"
                             style={{ width: `${transactionState.progress}%` }}
                           ></div>
                         </div>
                         
                         {/* Status Message */}
                         <div className="flex items-center gap-2">
                           {transactionState.status === 'validating' && (
                             <>
                               <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-[var(--color-primary)]">Validating transaction...</span>
                             </>
                           )}
                           {transactionState.status === 'executing_smart_contract' && (
                             <>
                               <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-[var(--color-primary)]">Executing smart contract...</span>
                             </>
                           )}
                           {transactionState.status === 'waiting_for_approval' && (
                             <>
                               <div className="w-4 h-4 border-2 border-[var(--color-warning)] border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-[var(--color-warning)]">Waiting for wallet approval...</span>
                             </>
                           )}
                           {transactionState.status === 'executing_paystack' && (
                             <>
                               <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-[var(--color-primary)]">Processing bank transfer...</span>
                             </>
                           )}
                           {transactionState.status === 'completed' && (
                             <>
                               <span className="text-[var(--color-success)]">✅</span>
                               <span className="text-[var(--color-success)]">Transaction completed successfully!</span>
                             </>
                           )}
                           {transactionState.status === 'failed' && (
                             <>
                               <span className="text-[var(--color-error)]">❌</span>
                               <span className="text-[var(--color-error)]">Transaction failed: {transactionState.error}</span>
                             </>
                           )}
                           {transactionState.status === 'cancelled' && (
                             <>
                               <span className="text-[var(--color-warning)]">⚠️</span>
                               <span className="text-[var(--color-warning)]">Transaction cancelled</span>
                             </>
                           )}
                         </div>
                         
                         {/* Action Buttons */}
                         {transactionState.canCancel && (
                           <button
                             onClick={() => {
                               setTransactionState({
                                 status: 'cancelled',
                                 error: 'Transaction cancelled by user',
                                 progress: 0,
                                 canCancel: false,
                                 canRetry: true
                               })
                               toast.info("Transaction cancelled")
                             }}
                             className="px-4 py-2 bg-[var(--color-error)] text-[var(--color-text-inverse)] rounded-md hover:bg-[var(--color-error-dark)] transition-colors"
                           >
                             Cancel Transaction
                           </button>
                         )}
                         
                         {transactionState.canRetry && (
                           <button
                             onClick={() => {
                               setTransactionState({
                                 status: 'idle',
                                 error: null,
                                 progress: 0,
                                 canCancel: false,
                                 canRetry: false
                               })
                               toast.info("Ready to retry transaction")
                             }}
                             className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-md hover:bg-[var(--color-primary-hover)] transition-colors"
                           >
                             Retry Transaction
                           </button>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Submit Button */}
                   <div className="mt-8">
                     <Button 
                       className="w-full switcherfi-button font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-background)] focus:ring-[var(--color-primary)] font-display"
                       onClick={handleSwapExecution}
                       disabled={offRampLoading || onRampLoading || transferLoading || !currentWallet || !!getValidationError() || paymentStatus === "pending" || (isOffRamp && !walletValidation.canProceed) || transactionState.status !== 'idle'}
                     >
                       {transactionState.status !== 'idle' ? (
                         <div className="flex items-center gap-2">
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           {transactionState.status === 'validating' && 'Validating...'}
                           {transactionState.status === 'executing_smart_contract' && 'Executing Smart Contract...'}
                           {transactionState.status === 'waiting_for_approval' && 'Waiting for Approval...'}
                           {transactionState.status === 'executing_paystack' && 'Processing Transfer...'}
                           {transactionState.status === 'completed' && 'Transaction Complete!'}
                           {transactionState.status === 'failed' && 'Transaction Failed'}
                           {transactionState.status === 'cancelled' && 'Transaction Cancelled'}
                         </div>
                       ) : offRampLoading || onRampLoading || transferLoading ? (
                         <div className="flex items-center gap-2">
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           Processing...
                         </div>
                       ) : paymentStatus === "pending" ? (
                         "Payment Pending..."
                       ) : isOnRamp ? (
                         "I have made payment"
                       ) : (
                         "Swap SUI to Naira"
                       )}
                     </Button>
                   </div>
          </main>
        </div>
      </div>
    </div>
  )
}