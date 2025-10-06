// React hook for price service integration
import { useState, useEffect, useCallback } from 'react'
import { priceService, PriceData, TokenSymbol, calculateExchangeRate, calculateReverseExchangeRate, formatPrice, formatPercentageChange } from '@/lib/price-service'

// Hook for getting price data
export function usePriceData(tokenSymbol: TokenSymbol) {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await priceService.getPrice(tokenSymbol)
      setPriceData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price')
    } finally {
      setLoading(false)
    }
  }, [tokenSymbol])

  useEffect(() => {
    fetchPrice()
    
    // Set up interval for updates
    const interval = setInterval(fetchPrice, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [fetchPrice])

  return {
    priceData,
    loading,
    error,
    refetch: fetchPrice
  }
}

// Hook for getting multiple token prices
export function useMultiplePrices(tokenSymbols: TokenSymbol[]) {
  const [prices, setPrices] = useState<Map<TokenSymbol, PriceData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await priceService.getPrices(tokenSymbols)
      setPrices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }, [tokenSymbols])

  useEffect(() => {
    fetchPrices()
    
    // Set up interval for updates
    const interval = setInterval(fetchPrices, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [fetchPrices])

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices
  }
}

// Hook for exchange rate calculations
export function useExchangeRate(fromToken: TokenSymbol, toToken: 'NAIRA', amount: number) {
  const { priceData, loading, error } = usePriceData(fromToken)
  const [exchangeRate, setExchangeRate] = useState<number>(0)

  useEffect(() => {
    if (priceData && amount > 0) {
      const rate = calculateExchangeRate(fromToken, toToken, amount, priceData)
      setExchangeRate(rate)
    }
  }, [priceData, amount, fromToken, toToken])

  return {
    exchangeRate,
    loading,
    error,
    formattedRate: formatPrice(exchangeRate),
    priceChange: priceData ? formatPercentageChange(priceData.change24h) : null
  }
}

// Hook for reverse exchange rate calculations (Naira to Token)
export function useReverseExchangeRate(fromCurrency: 'NAIRA', toToken: TokenSymbol, nairaAmount: number) {
  const { priceData, loading, error } = usePriceData(toToken)
  const [reverseExchangeRate, setReverseExchangeRate] = useState<number>(0)

  useEffect(() => {
    if (priceData && nairaAmount > 0) {
      const rate = calculateReverseExchangeRate(fromCurrency, toToken, nairaAmount, priceData)
      setReverseExchangeRate(rate)
    }
  }, [priceData, nairaAmount, fromCurrency, toToken])

  return {
    reverseExchangeRate,
    loading,
    error,
    formattedRate: reverseExchangeRate > 0 ? reverseExchangeRate.toFixed(6) : '0',
    priceChange: priceData ? formatPercentageChange(priceData.change24h) : null
  }
}

// Hook for real-time price updates with custom interval
export function useRealTimePrice(tokenSymbol: TokenSymbol, updateInterval: number = 30000, transactionType?: 'ON_RAMP' | 'OFF_RAMP') {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      setError(null)
      
      const data = await priceService.getPrice(tokenSymbol, transactionType)
      setPriceData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price')
    } finally {
      setLoading(false)
    }
  }, [tokenSymbol, transactionType])

  useEffect(() => {
    // Initial fetch
    fetchPrice()
    
    // Set up interval for updates
    const interval = setInterval(fetchPrice, updateInterval)
    
    return () => clearInterval(interval)
  }, [fetchPrice, updateInterval])

  return {
    priceData,
    loading,
    error,
    refetch: fetchPrice,
    formattedPrice: priceData ? formatPrice(priceData.price) : null,
    priceChange: priceData ? formatPercentageChange(priceData.change24h) : null
  }
}

// Hook for price history (placeholder for future implementation)
export function usePriceHistory(tokenSymbol: TokenSymbol, days: number = 7) {
  const [history, setHistory] = useState<Array<{ timestamp: number; price: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Placeholder implementation
    // In the future, this would fetch historical price data
    setLoading(false)
  }, [tokenSymbol, days])

  return {
    history,
    loading,
    error
  }
}
