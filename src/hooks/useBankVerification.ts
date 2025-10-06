import { useState, useCallback } from 'react'
import axios from 'axios'

interface Bank {
  id: number
  name: string
  code: string
  longcode: string
  gateway: string | null
  pay_with_bank: boolean
  active: boolean
  is_deleted: boolean
  country: string
  currency: string
  type: string
}

interface VerifyAccountResponse {
  success: boolean
  accountName?: string
  accountNumber?: string
  bankCode?: string
  error?: string
}

interface BanksResponse {
  success: boolean
  banks?: Bank[]
  error?: string
}

export function useBankVerification() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBanks = useCallback(async (): Promise<Bank[]> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await axios.get<BanksResponse>('/api/banks')
      
      if (response.data.success && response.data.banks) {
        return response.data.banks.filter(bank => bank.active)
      } else {
        throw new Error(response.data.error || 'Failed to fetch banks')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch banks'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyAccount = useCallback(async (
    accountNumber: string, 
    bankCode: string
  ): Promise<VerifyAccountResponse> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await axios.post<VerifyAccountResponse>('/api/verify-account', {
        accountNumber,
        bankCode,
      })
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.error || 'Failed to verify account')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to verify account'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    fetchBanks,
    verifyAccount,
  }
}
