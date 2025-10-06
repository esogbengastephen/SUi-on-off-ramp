// React hook for checking token balances on Sui
import { useState, useEffect, useCallback } from 'react'
import { useCurrentWallet, useSuiClient } from '@mysten/dapp-kit'
import { TOKEN_CONFIG, TokenSymbol } from '@/lib/price-service'

export interface TokenBalance {
  symbol: TokenSymbol
  balance: bigint
  formattedBalance: string
  decimals: number
}

export function useTokenBalance(tokenSymbol: TokenSymbol) {
  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { currentWallet } = useCurrentWallet()
  const suiClient = useSuiClient()

  const fetchBalance = useCallback(async () => {
    if (!currentWallet?.accounts?.[0]?.address) {
      setBalance(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const tokenConfig = TOKEN_CONFIG[tokenSymbol]
      const walletAddress = currentWallet.accounts[0].address

      if (tokenSymbol === 'SUI') {
        // For native SUI token
        const balanceObj = await suiClient.getBalance({
          owner: walletAddress,
          coinType: tokenConfig.address
        })

        const balanceAmount = BigInt(balanceObj.totalBalance)
        const formattedBalance = (Number(balanceAmount) / Math.pow(10, tokenConfig.decimals)).toFixed(4)

        setBalance({
          symbol: tokenSymbol,
          balance: balanceAmount,
          formattedBalance,
          decimals: tokenConfig.decimals
        })
      } else {
        // For other tokens (USDC, USDT)
        const balanceObj = await suiClient.getBalance({
          owner: walletAddress,
          coinType: tokenConfig.address
        })

        const balanceAmount = BigInt(balanceObj.totalBalance)
        const formattedBalance = (Number(balanceAmount) / Math.pow(10, tokenConfig.decimals)).toFixed(2)

        setBalance({
          symbol: tokenSymbol,
          balance: balanceAmount,
          formattedBalance,
          decimals: tokenConfig.decimals
        })
      }

    } catch (err) {
      console.error(`Error fetching ${tokenSymbol} balance:`, err)
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
    } finally {
      setLoading(false)
    }
  }, [currentWallet, suiClient, tokenSymbol])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance
  }
}

// Hook for getting multiple token balances
export function useMultipleTokenBalances(tokenSymbols: TokenSymbol[]) {
  const [balances, setBalances] = useState<Map<TokenSymbol, TokenBalance>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { currentWallet } = useCurrentWallet()
  const suiClient = useSuiClient()

  const fetchBalances = useCallback(async () => {
    if (!currentWallet?.accounts?.[0]?.address) {
      setBalances(new Map())
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const walletAddress = currentWallet.accounts[0].address
      const balancePromises = tokenSymbols.map(async (symbol) => {
        const tokenConfig = TOKEN_CONFIG[symbol]
        
        try {
          const balanceObj = await suiClient.getBalance({
            owner: walletAddress,
            coinType: tokenConfig.address
          })

          const balanceAmount = BigInt(balanceObj.totalBalance)
          const formattedBalance = (Number(balanceAmount) / Math.pow(10, tokenConfig.decimals)).toFixed(
            symbol === 'SUI' ? 4 : 2
          )

          return {
            symbol,
            balance: {
              symbol,
              balance: balanceAmount,
              formattedBalance,
              decimals: tokenConfig.decimals
            } as TokenBalance
          }
        } catch (err) {
          console.error(`Error fetching ${symbol} balance:`, err)
          return null
        }
      })

      const results = await Promise.all(balancePromises)
      const newBalances = new Map<TokenSymbol, TokenBalance>()

      results.forEach((result) => {
        if (result) {
          newBalances.set(result.symbol, result.balance)
        }
      })

      setBalances(newBalances)

    } catch (err) {
      console.error('Error fetching token balances:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch balances')
    } finally {
      setLoading(false)
    }
  }, [currentWallet, suiClient, tokenSymbols])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances
  }
}

// Utility function to check if user has sufficient balance
export function hasInsufficientBalance(
  requiredAmount: string,
  tokenBalance: TokenBalance | null
): boolean {
  if (!tokenBalance || !requiredAmount) return true

  const required = parseFloat(requiredAmount)
  const available = parseFloat(tokenBalance.formattedBalance)

  return available < required
}
