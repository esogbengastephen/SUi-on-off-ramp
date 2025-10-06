"use client"

import { useState, useEffect, useRef } from "react"
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

interface BankSelectorProps {
  selectedBank: Bank | null
  onBankSelect: (bank: Bank | null) => void
  placeholder?: string
}

export function BankSelector({ selectedBank, onBankSelect, placeholder = "Select Bank" }: BankSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { fetchBanks, isLoading, error } = useBankVerification()

  // Fetch banks on component mount
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const bankList = await fetchBanks()
        setBanks(bankList)
      } catch (err) {
        console.error('Failed to load banks:', err)
      }
    }
    loadBanks()
  }, [fetchBanks])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBankSelect = (bank: Bank) => {
    onBankSelect(bank)
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-display"
        disabled={isLoading}
      >
        <span className={`${selectedBank ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {selectedBank ? selectedBank.name : placeholder}
        </span>
        <span className="material-icons text-gray-600 dark:text-gray-400">
          {isLoading ? 'refresh' : isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <input
              type="text"
              placeholder="Search banks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none font-display"
            />
          </div>

          {/* Bank list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredBanks.length > 0 ? (
              filteredBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => handleBankSelect(bank)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-900 dark:text-gray-100 font-display">{bank.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{bank.code}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? 'No banks found' : 'Loading banks...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
