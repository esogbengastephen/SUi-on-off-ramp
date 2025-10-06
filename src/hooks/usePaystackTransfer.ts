import { useState, useCallback } from 'react'

interface TransferRecipient {
  id: number
  recipient_code: string
  name: string
  account_number: string
  bank_code: string
  bank_name: string
  created_at: string
}

interface Transfer {
  id: number
  reference: string
  amount: number
  status: 'pending' | 'success' | 'failed' | 'reversed' | 'otp'
  recipient: TransferRecipient
  created_at: string
  updated_at: string
}

interface UsePaystackTransferReturn {
  createTransferRecipient: (accountNumber: string, bankCode: string, accountName: string) => Promise<TransferRecipient | null>
  initiateTransfer: (recipientCode: string, amount: number, reason: string, reference?: string) => Promise<Transfer | null>
  checkTransferStatus: (transferId: string) => Promise<Transfer | null>
  isLoading: boolean
  error: string | null
}

export function usePaystackTransfer(): UsePaystackTransferReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTransferRecipient = useCallback(async (
    accountNumber: string,
    bankCode: string,
    accountName: string
  ): Promise<TransferRecipient | null> => {
    console.log('🚀 EXECUTOR: Starting createTransferRecipient')
    console.log('🚀 EXECUTOR: Parameters:', { accountNumber, bankCode, accountName })
    
    setIsLoading(true)
    setError(null)

    try {
      console.log("🚀 EXECUTOR: Creating transfer recipient API call with:", {
        accountNumber,
        bankCode,
        accountName
      })

      const response = await fetch('/api/paystack/transfer-recipient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber,
          bankCode,
          accountName
        })
      })

      const data = await response.json()
      console.log("🚀 EXECUTOR: Transfer recipient API response:", { status: response.status, data })

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to create transfer recipient'
        console.log('❌ EXECUTOR: Transfer recipient API error:', errorMessage)
        console.log('❌ EXECUTOR: Response status:', response.status)
        console.log('❌ EXECUTOR: Response data:', data)
        throw new Error(errorMessage)
      }

      console.log('✅ EXECUTOR: Transfer recipient created successfully:', data.recipient)
      return data.recipient
    } catch (err: any) {
      console.log('❌ EXECUTOR: Transfer recipient hook error:', err)
      console.log('❌ EXECUTOR: Error message:', err.message)
      setError(err.message)
      return null
    } finally {
      console.log('🏁 EXECUTOR: createTransferRecipient finished, setting loading to false')
      setIsLoading(false)
    }
  }, [])

  const initiateTransfer = useCallback(async (
    recipientCode: string,
    amount: number,
    reason: string,
    reference?: string
  ): Promise<Transfer | null> => {
    console.log('🚀 EXECUTOR: Starting initiateTransfer')
    console.log('🚀 EXECUTOR: Parameters:', { recipientCode, amount, reason, reference })
    
    setIsLoading(true)
    setError(null)

    try {
      console.log("🚀 EXECUTOR: Initiating transfer API call with:", {
        recipientCode,
        amount,
        reason,
        reference
      })

      const response = await fetch('/api/paystack/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientCode,
          amount,
          reason,
          reference
        })
      })

      const data = await response.json()
      console.log("🚀 EXECUTOR: Transfer API response:", { status: response.status, data })

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to initiate transfer'
        console.log('❌ EXECUTOR: Transfer API error:', errorMessage)
        console.log('❌ EXECUTOR: Response status:', response.status)
        console.log('❌ EXECUTOR: Response data:', data)
        throw new Error(errorMessage)
      }

      console.log('✅ EXECUTOR: Transfer initiated successfully:', data.transfer)
      return data.transfer
    } catch (err: any) {
      console.log('❌ EXECUTOR: Transfer hook error:', err)
      console.log('❌ EXECUTOR: Error message:', err.message)
      setError(err.message)
      return null
    } finally {
      console.log('🏁 EXECUTOR: initiateTransfer finished, setting loading to false')
      setIsLoading(false)
    }
  }, [])

  const checkTransferStatus = useCallback(async (transferId: string): Promise<Transfer | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/paystack/transfer-status?transferId=${transferId}`)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check transfer status')
      }

      return data.transfer
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    createTransferRecipient,
    initiateTransfer,
    checkTransferStatus,
    isLoading,
    error
  }
}
