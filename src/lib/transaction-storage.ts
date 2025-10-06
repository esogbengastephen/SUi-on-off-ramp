// Local transaction storage for admin dashboard
export interface StoredTransaction {
  id: string
  type: 'ON_RAMP' | 'OFF_RAMP'
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'FAILED'
  suiAmount: number
  nairaAmount: number
  userAddress: string
  createdAt: number
  paymentReference?: string
  bankAccount?: string
  bankName?: string
  paymentSourceAccount?: string
  paymentSourceName?: string
  transferId?: string
  transferStatus?: 'pending' | 'success' | 'failed' | 'otp'
  errorMessage?: string
  verificationData?: {
    requestedTokenAmount: number
    requestedNairaAmount: number
    tokenType: string
    tokenConfig?: {
      symbol: string
      name: string
      address: string
      decimals: number
      icon: string
      color: string
    }
    suiAmount?: number
    exchangeRate: number
    calculatedNairaAmount: number
    amountMatches: boolean
  }
}

const STORAGE_KEY = 'sui_naira_transactions'

export function saveTransaction(transaction: StoredTransaction): void {
  try {
    const existing = getTransactions()
    const updated = [...existing, transaction]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving transaction:', error)
  }
}

export function getTransactions(): StoredTransaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error getting transactions:', error)
    return []
  }
}

export function updateTransaction(id: string, updates: Partial<StoredTransaction>): void {
  try {
    const transactions = getTransactions()
    const updated = transactions.map(tx => 
      tx.id === id ? { ...tx, ...updates } : tx
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error updating transaction:', error)
  }
}

export function clearTransactions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing transactions:', error)
  }
}
