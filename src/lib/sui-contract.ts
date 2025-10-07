import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

// Contract configuration
export const CONTRACT_CONFIG = {
  packageId: process.env.NEXT_PUBLIC_SUI_CONTRACT_PACKAGE_ID || process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || '0x0',
  moduleName: 'swap',
  network: 'testnet' as const,
}

// Sui client instance
export const suiClient = new SuiClient({
  url: getFullnodeUrl(CONTRACT_CONFIG.network),
})

// Contract function names
export const CONTRACT_FUNCTIONS = {
  INIT: 'init',
  INITIATE_OFF_RAMP: 'initiate_off_ramp',
  INITIATE_ON_RAMP: 'initiate_on_ramp',
  CONFIRM_ON_RAMP_PAYMENT: 'confirm_on_ramp_payment',
  COMPLETE_OFF_RAMP: 'complete_off_ramp',
  PAUSE_CONTRACT: 'pause_contract',
  UNPAUSE_CONTRACT: 'unpause_contract',
  UPDATE_EXCHANGE_RATE: 'update_exchange_rate',
  UPDATE_SWAP_LIMITS: 'update_swap_limits',
  DEPOSIT_TO_TREASURY: 'deposit_to_treasury',
} as const

// Transaction types
export interface SwapTransaction {
  tx_id: string
  user_address: string
  swap_type: 'OFF_RAMP' | 'ON_RAMP'
  sui_amount: number
  naira_amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  created_at: number
  confirmed_at?: number
  bank_details?: {
    account_name: string
    account_number: string
    bank_code: string
  }
}

export interface ContractState {
  paused: boolean
  exchange_rate: number
  min_swap_amount: number
  max_swap_amount: number
  treasury_address: string
}

// Helper functions for contract interactions
export class SuiSwapContract {
  private packageId: string
  private moduleName: string

  constructor(packageId: string) {
    this.packageId = packageId
    this.moduleName = CONTRACT_CONFIG.moduleName
  }

  /**
   * Create a transaction block for OFF-RAMP (SUI → Naira)
   */
  async createOffRampTransaction(
    swapContractId: string,
    suiAmount: number,
    bankDetails: {
      account_name: string
      account_number: string
      bank_code: string
    }
  ): Promise<Transaction> {
    const txb = new Transaction()
    
    // Split SUI coin for payment
    // This creates a coin object that can be passed to the contract
    const suiCoin = txb.splitCoins(txb.gas, [txb.pure.u64(suiAmount)])
    
    // Call initiate_off_ramp function with the coin
    txb.moveCall({
      target: `${this.packageId}::${this.moduleName}::${CONTRACT_FUNCTIONS.INITIATE_OFF_RAMP}`,
      arguments: [
        txb.object(swapContractId),
        suiCoin, // Pass the coin object
        txb.pure.string(bankDetails.account_number), // bank_account
        txb.pure.string(bankDetails.account_name),   // bank_name
      ],
    })
    
    return txb
  }

  /**
   * Create a transaction block for ON-RAMP (Naira → SUI)
   */
  async createOnRampTransaction(
    swapContractId: string,
    nairaAmount: number,
    paymentSourceAccount: string,
    paymentSourceBank: string,
    paymentSourceName: string
  ): Promise<Transaction> {
    const txb = new Transaction()
    
    // Call initiate_on_ramp function
    txb.moveCall({
      target: `${this.packageId}::${this.moduleName}::${CONTRACT_FUNCTIONS.INITIATE_ON_RAMP}`,
      arguments: [
        txb.object(swapContractId),
        txb.pure.u64(nairaAmount),
        txb.pure.string(paymentSourceAccount),
        txb.pure.string(paymentSourceBank),
        txb.pure.string(paymentSourceName),
      ],
    })

    return txb
  }

  /**
   * Get contract state
   */
  async getContractState(swapContractId: string): Promise<ContractState | null> {
    try {
      const object = await suiClient.getObject({
        id: swapContractId,
        options: { showContent: true },
      })

      if (object.data?.content && 'fields' in object.data.content) {
        const fields = object.data.content.fields as any
        return {
          paused: fields.paused,
          exchange_rate: Number(fields.exchange_rate),
          min_swap_amount: Number(fields.min_swap_amount),
          max_swap_amount: Number(fields.max_swap_amount),
          treasury_address: fields.treasury_address,
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching contract state:', error)
      return null
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(txId: string): Promise<SwapTransaction | null> {
    try {
      const object = await suiClient.getObject({
        id: txId,
        options: { showContent: true },
      })

      if (object.data?.content && 'fields' in object.data.content) {
        const fields = object.data.content.fields as any
        return {
          tx_id: fields.tx_id,
          user_address: fields.user_address,
          swap_type: fields.swap_type,
          sui_amount: Number(fields.sui_amount),
          naira_amount: Number(fields.naira_amount),
          status: fields.status,
          created_at: Number(fields.created_at),
          confirmed_at: fields.confirmed_at ? Number(fields.confirmed_at) : undefined,
          bank_details: fields.bank_details ? {
            account_name: fields.bank_details.account_name,
            account_number: fields.bank_details.account_number,
            bank_code: fields.bank_details.bank_code,
          } : undefined,
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return null
    }
  }

  /**
   * Admin function: Confirm ON-RAMP payment
   */
  async confirmOnRampPayment(
    swapContractId: string,
    treasuryId: string,
    transactionId: string,
    paymentCoinId: string,
    adminCapId: string
  ): Promise<Transaction> {
    const txb = new Transaction()
    
    txb.moveCall({
      target: `${this.packageId}::${this.moduleName}::${CONTRACT_FUNCTIONS.CONFIRM_ON_RAMP_PAYMENT}`,
      arguments: [
        txb.object(swapContractId),
        txb.object(treasuryId),
        txb.object(transactionId),
        txb.object(paymentCoinId),
        txb.object(adminCapId),
      ],
    })

    return txb
  }

  /**
   * Admin function: Complete OFF-RAMP
   */
  async completeOffRamp(
    swapContractId: string,
    transactionId: string,
    adminCapId: string
  ): Promise<Transaction> {
    const txb = new Transaction()
    
    txb.moveCall({
      target: `${this.packageId}::${this.moduleName}::${CONTRACT_FUNCTIONS.COMPLETE_OFF_RAMP}`,
      arguments: [
        txb.object(swapContractId),
        txb.object(transactionId),
        txb.object(adminCapId),
      ],
    })

    return txb
  }

  /**
   * Admin function: Pause contract
   */
  async pauseContract(
    swapContractId: string,
    adminCapId: string
  ): Promise<Transaction> {
    const txb = new Transaction()
    
    txb.moveCall({
      target: `${this.packageId}::${this.moduleName}::${CONTRACT_FUNCTIONS.PAUSE_CONTRACT}`,
      arguments: [
        txb.object(swapContractId),
        txb.object(adminCapId),
      ],
    })

    return txb
  }

  /**
   * Admin function: Unpause contract
   */
  async unpauseContract(
    swapContractId: string,
    adminCapId: string
  ): Promise<Transaction> {
    const txb = new Transaction()
    
    txb.moveCall({
      target: `${this.packageId}::${this.moduleName}::${CONTRACT_FUNCTIONS.UNPAUSE_CONTRACT}`,
      arguments: [
        txb.object(swapContractId),
        txb.object(adminCapId),
      ],
    })

    return txb
  }

  /**
   * Admin function: Update exchange rate
   */
  async updateExchangeRate(
    swapContractId: string,
    newRate: number,
    adminCapId: string
  ): Promise<Transaction> {
    const txb = new Transaction()
    
    txb.moveCall({
      target: `${this.packageId}::${this.moduleName}::${CONTRACT_FUNCTIONS.UPDATE_EXCHANGE_RATE}`,
      arguments: [
        txb.object(swapContractId),
        txb.pure.u64(newRate),
        txb.object(adminCapId),
      ],
    })

    return txb
  }
}

// Export singleton instance
export const suiSwapContract = new SuiSwapContract(CONTRACT_CONFIG.packageId)
