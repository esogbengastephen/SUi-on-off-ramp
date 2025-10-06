"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BankSelector } from "./BankSelector"
import { useBankVerification } from "@/hooks/useBankVerification"

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

interface AccountVerifierProps {
  onAccountVerified?: (accountName: string, accountNumber: string, bankCode: string, bankName: string) => void
  onAccountChange?: (accountNumber: string, bankCode: string) => void
}

export function AccountVerifier({ onAccountVerified, onAccountChange }: AccountVerifierProps) {
  const [accountNumber, setAccountNumber] = useState("")
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [accountName, setAccountName] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const { verifyAccount, isLoading } = useBankVerification()

  // Auto-verify when both account number and bank are provided
  useEffect(() => {
    const verifyAccountDetails = async () => {
      if (accountNumber.length >= 10 && selectedBank && !isVerifying) {
        setIsVerifying(true)
        setVerificationError(null)
        
        try {
          const result = await verifyAccount(accountNumber, selectedBank.code)
          if (result.success && result.accountName) {
            setAccountName(result.accountName)
            onAccountVerified?.(result.accountName, accountNumber, selectedBank.code, selectedBank.name)
          }
        } catch (error: any) {
          setVerificationError(error.message)
          setAccountName("")
        } finally {
          setIsVerifying(false)
        }
      } else {
        setAccountName("")
        setVerificationError(null)
      }
    }

    // Debounce verification
    const timeoutId = setTimeout(verifyAccountDetails, 1000)
    return () => clearTimeout(timeoutId)
  }, [accountNumber, selectedBank, verifyAccount, onAccountVerified, isVerifying])

  // Notify parent component of changes
  useEffect(() => {
    onAccountChange?.(accountNumber, selectedBank?.code || "")
  }, [accountNumber, selectedBank, onAccountChange])

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setAccountNumber(value)
    }
  }

  const handleBankSelect = (bank: Bank | null) => {
    setSelectedBank(bank)
    setAccountName("")
    setVerificationError(null)
  }

  return (
    <div className="space-y-4">
      {/* Bank Selection */}
      <div>
        <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 font-display">
          Select Bank
        </Label>
        <BankSelector
          selectedBank={selectedBank}
          onBankSelect={handleBankSelect}
          placeholder="Choose your bank"
        />
      </div>

      {/* Account Number Input */}
      <div>
        <Label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 font-display">
          Account Number
        </Label>
        <Input
          type="text"
          placeholder="Enter your account number"
          value={accountNumber}
          onChange={handleAccountNumberChange}
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 font-display"
          maxLength={10}
        />
      </div>

      {/* Account Name Display */}
      {accountName && (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-green-600 dark:text-green-400">
            <span className="text-sm font-medium font-display">Account Name: </span>
            <span className="text-sm font-display">{accountName}</span>
          </div>
        </div>
      )}
      
      {/* Verification Error Display */}
      {verificationError && (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-red-500 dark:text-red-400">
            <span className="text-sm font-display">{verificationError}</span>
          </div>
        </div>
      )}
    </div>
  )
}
