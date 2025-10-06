import { useState, useCallback } from 'react'
import { useCurrentWallet, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { suiSwapContract, SwapTransaction, ContractState } from '@/lib/sui-contract'
import { toast } from 'sonner'

// Contract interaction hook
export function useSuiSwapContract() {
  const { currentWallet } = useCurrentWallet()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeTransaction = useCallback(async (
    txb: any,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    console.log('🚀 EXECUTOR: Starting transaction execution')
    console.log('🚀 EXECUTOR: Transaction builder:', txb)
    console.log('🚀 EXECUTOR: Current wallet:', currentWallet?.accounts?.[0]?.address)
    
    if (!currentWallet) {
      const errorMsg = 'Please connect your wallet first'
      console.log('❌ EXECUTOR: No wallet connected')
      setError(errorMsg)
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }

    setIsLoading(true)
    setError(null)
    console.log('🚀 EXECUTOR: Starting signAndExecute...')

    try {
      // Use mutateAsync for proper error handling
      const result = await signAndExecute({
        transaction: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      })

      console.log('✅ EXECUTOR: Transaction completed successfully!')
      console.log('✅ EXECUTOR: Transaction result:', result)
      console.log('✅ EXECUTOR: Transaction effects:', result.effects)
      console.log('✅ EXECUTOR: Transaction status:', result.effects?.status?.status)
      console.log('✅ EXECUTOR: Full effects object:', JSON.stringify(result.effects, null, 2))
      console.log('✅ EXECUTOR: Effects status object:', JSON.stringify(result.effects?.status, null, 2))
      
      // Check if transaction was cancelled by user or failed
      if (!result) {
        const errorMsg = 'Transaction was cancelled by user'
        setError(errorMsg)
        toast.error(errorMsg)
        onError?.(new Error(errorMsg))
        throw new Error(errorMsg)
      }
      
      if (result.effects?.status?.status === 'failure') {
        const errorMsg = 'Transaction failed on blockchain'
        setError(errorMsg)
        toast.error(errorMsg)
        onError?.(new Error(errorMsg))
        throw new Error(errorMsg)
      }
      
      console.log('🔍 EXECUTOR: Checking transaction status...')
      console.log('🔍 EXECUTOR: Status value:', result.effects?.status?.status)
      console.log('🔍 EXECUTOR: Status type:', typeof result.effects?.status?.status)
      console.log('🔍 EXECUTOR: Alternative success check - result.digest:', result.digest)
      console.log('🔍 EXECUTOR: Alternative success check - result.effects?.status:', result.effects?.status)
      console.log('🔍 EXECUTOR: Alternative success check - result.effects?.status?.status === "success":', result.effects?.status?.status === 'success')
      
      // Check for success using multiple possible formats
      const isSuccess = result.effects?.status?.status === 'success' || 
                       result.effects?.status?.status === 'Success' ||
                       result.effects?.status?.status === 'SUCCESS' ||
                       (result.digest && !result.effects?.status?.status) || // If we have a digest but no explicit failure
                       result.effects?.status === 'success'
      
      console.log('🔍 EXECUTOR: Success check result:', isSuccess)
      
      if (isSuccess) {
        console.log('✅ EXECUTOR: Transaction status is SUCCESS - calling onSuccess callback')
        console.log('✅ EXECUTOR: onSuccess callback exists:', !!onSuccess)
        toast.success('Transaction completed successfully!')
        
        if (onSuccess) {
          console.log('✅ EXECUTOR: Executing onSuccess callback...')
          onSuccess(result)
          console.log('✅ EXECUTOR: onSuccess callback completed')
        } else {
          console.log('⚠️ EXECUTOR: No onSuccess callback provided')
        }
        
        return result
      } else if (result.effects?.status?.status === 'failure' || 
                 result.effects?.status?.status === 'Failure' ||
                 result.effects?.status?.status === 'FAILURE') {
        console.log('❌ EXECUTOR: Transaction status is FAILURE')
        const errorMsg = 'Transaction failed on blockchain'
        setError(errorMsg)
        toast.error(errorMsg)
        onError?.(new Error(errorMsg))
        throw new Error(errorMsg)
      } else {
        const errorMsg = 'Transaction status unknown'
        console.log('❌ EXECUTOR: Transaction status unknown:', result.effects?.status?.status)
        console.log('❌ EXECUTOR: All possible status values:', Object.keys(result.effects?.status || {}))
        console.log('❌ EXECUTOR: Full status object:', JSON.stringify(result.effects?.status, null, 2))
        setError(errorMsg)
        toast.error(errorMsg)
        onError?.(new Error(errorMsg))
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      console.log('❌ EXECUTOR: Transaction rejected or failed:', err)
      console.log('❌ EXECUTOR: Error message:', err.message)
      console.log('❌ EXECUTOR: Error code:', err.code)
      console.log('❌ EXECUTOR: Full error object:', err)
      
      // Check if this is a user cancellation error
      if (err.message?.includes('User rejected') || 
          err.message?.includes('cancelled') || 
          err.message?.includes('rejected') ||
          err.code === 'USER_REJECTED') {
        const errorMsg = 'Transaction was cancelled by user'
        console.log('❌ EXECUTOR: User cancelled transaction')
        setError(errorMsg)
        toast.error(errorMsg)
        onError?.(new Error(errorMsg))
        throw new Error(errorMsg)
      }
      
      const errorMsg = err.message || 'Transaction failed'
      console.log('❌ EXECUTOR: Transaction failed with error:', errorMsg)
      setError(errorMsg)
      toast.error(errorMsg)
      onError?.(err)
      throw err
    } finally {
      console.log('🏁 EXECUTOR: Transaction execution finished, setting loading to false')
      setIsLoading(false)
    }
  }, [currentWallet, signAndExecute])

  return {
    executeTransaction,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}

// OFF-RAMP hook (SUI → Naira)
export function useOffRampSwap() {
  const { executeTransaction, isLoading, error } = useSuiSwapContract()
  const [contractState, setContractState] = useState<ContractState | null>(null)

  const initiateOffRamp = useCallback(async (
    swapContractId: string,
    suiAmount: number,
    bankDetails: {
      account_name: string
      account_number: string
      bank_code: string
    }
  ) => {
    console.log('🚀 EXECUTOR: Starting OFF-RAMP transaction')
    console.log('🚀 EXECUTOR: Swap Contract ID:', swapContractId)
    console.log('🚀 EXECUTOR: SUI Amount:', suiAmount)
    console.log('🚀 EXECUTOR: Bank Details:', bankDetails)
    
    const txb = await suiSwapContract.createOffRampTransaction(
      swapContractId,
      suiAmount,
      bankDetails
    )
    
    console.log('🚀 EXECUTOR: Transaction builder created:', txb)

    await executeTransaction(txb, (result) => {
      console.log('✅ EXECUTOR: OFF-RAMP transaction SUCCESS callback executed!')
      console.log('✅ EXECUTOR: OFF-RAMP result:', result)
      // You can extract transaction ID from result if needed
    }, (error) => {
      console.log('❌ EXECUTOR: OFF-RAMP transaction ERROR callback executed!')
      console.log('❌ EXECUTOR: OFF-RAMP error:', error)
    })
    
    console.log('✅ EXECUTOR: OFF-RAMP transaction completed successfully!')
  }, [executeTransaction])

  const getContractState = useCallback(async (swapContractId: string) => {
    const state = await suiSwapContract.getContractState(swapContractId)
    setContractState(state)
    return state
  }, [])

  return {
    initiateOffRamp,
    getContractState,
    contractState,
    isLoading,
    error,
  }
}

// ON-RAMP hook (Naira → SUI)
export function useOnRampSwap() {
  const { executeTransaction, isLoading, error } = useSuiSwapContract()

  const initiateOnRamp = useCallback(async (
    swapContractId: string,
    nairaAmount: number,
    paymentSourceAccount: string,
    paymentSourceBank: string,
    paymentSourceName: string
  ) => {
    const txb = await suiSwapContract.createOnRampTransaction(
      swapContractId,
      nairaAmount,
      paymentSourceAccount,
      paymentSourceBank,
      paymentSourceName
    )

    await executeTransaction(txb, (result) => {
      console.log('ON-RAMP initiated:', result)
      // You can extract transaction ID from result if needed
    })
  }, [executeTransaction])

  return {
    initiateOnRamp,
    isLoading,
    error,
  }
}

// Admin functions hook
export function useAdminFunctions() {
  const { executeTransaction, isLoading, error } = useSuiSwapContract()

  const confirmOnRampPayment = useCallback(async (
    swapContractId: string,
    treasuryId: string,
    transactionId: string,
    paymentCoinId: string,
    adminCapId: string
  ) => {
    const txb = await suiSwapContract.confirmOnRampPayment(
      swapContractId,
      treasuryId,
      transactionId,
      paymentCoinId,
      adminCapId
    )

    await executeTransaction(txb, (result) => {
      console.log('ON-RAMP payment confirmed:', result)
      toast.success('Payment confirmed and SUI sent to user!')
    })
  }, [executeTransaction])

  const completeOffRamp = useCallback(async (
    swapContractId: string,
    transactionId: string,
    adminCapId: string
  ) => {
    const txb = await suiSwapContract.completeOffRamp(
      swapContractId,
      transactionId,
      adminCapId
    )

    await executeTransaction(txb, (result) => {
      console.log('OFF-RAMP completed:', result)
      toast.success('OFF-RAMP transaction completed!')
    })
  }, [executeTransaction])

  const pauseContract = useCallback(async (
    swapContractId: string,
    adminCapId: string
  ) => {
    const txb = await suiSwapContract.pauseContract(swapContractId, adminCapId)

    await executeTransaction(txb, (result) => {
      console.log('Contract paused:', result)
      toast.success('Contract paused successfully!')
    })
  }, [executeTransaction])

  const unpauseContract = useCallback(async (
    swapContractId: string,
    adminCapId: string
  ) => {
    const txb = await suiSwapContract.unpauseContract(swapContractId, adminCapId)

    await executeTransaction(txb, (result) => {
      console.log('Contract unpaused:', result)
      toast.success('Contract unpaused successfully!')
    })
  }, [executeTransaction])

  const updateExchangeRate = useCallback(async (
    swapContractId: string,
    newRate: number,
    adminCapId: string
  ) => {
    const txb = await suiSwapContract.updateExchangeRate(
      swapContractId,
      newRate,
      adminCapId
    )

    await executeTransaction(txb, (result) => {
      console.log('Exchange rate updated:', result)
      toast.success(`Exchange rate updated to ${newRate}!`)
    })
  }, [executeTransaction])

  return {
    confirmOnRampPayment,
    completeOffRamp,
    pauseContract,
    unpauseContract,
    updateExchangeRate,
    isLoading,
    error,
  }
}

// Transaction management hook
export function useTransactionManagement() {
  const [transactions, setTransactions] = useState<SwapTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const getTransaction = useCallback(async (txId: string): Promise<SwapTransaction | null> => {
    setIsLoading(true)
    try {
      const transaction = await suiSwapContract.getTransaction(txId)
      return transaction
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshTransactions = useCallback(async (txIds: string[]) => {
    setIsLoading(true)
    try {
      const txPromises = txIds.map(id => suiSwapContract.getTransaction(id))
      const results = await Promise.all(txPromises)
      const validTransactions = results.filter(tx => tx !== null) as SwapTransaction[]
      setTransactions(validTransactions)
    } catch (error) {
      console.error('Error refreshing transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    transactions,
    getTransaction,
    refreshTransactions,
    isLoading,
  }
}
