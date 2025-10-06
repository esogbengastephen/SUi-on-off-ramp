import { useSuiClient } from '@mysten/dapp-kit';
import { SUPPORTED_TOKENS, SupportedTokenSymbol } from '@/lib/multi-token-contract';
import { useState, useEffect } from 'react';

export function useTokenBalances(address: string) {
  const client = useSuiClient();
  const [balances, setBalances] = useState<Record<SupportedTokenSymbol, number>>({
    SUI: 0,
    USDC: 0,
    USDT: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getTokenBalance = async (tokenSymbol: SupportedTokenSymbol): Promise<number> => {
    const tokenInfo = SUPPORTED_TOKENS[tokenSymbol];
    
    try {
      const coins = await client.getCoins({
        owner: address,
        coinType: tokenInfo.address,
      });
      
      const totalBalance = coins.data.reduce((sum, coin) => {
        return sum + Number(coin.balance);
      }, 0);
      
      // Convert from smallest unit to display unit
      return totalBalance / Math.pow(10, tokenInfo.decimals);
    } catch (error) {
      console.error(`Failed to get ${tokenSymbol} balance:`, error);
      return 0;
    }
  };
  
  const getAllBalances = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newBalances: Record<SupportedTokenSymbol, number> = {} as any;
      
      for (const tokenSymbol of Object.keys(SUPPORTED_TOKENS) as SupportedTokenSymbol[]) {
        newBalances[tokenSymbol] = await getTokenBalance(tokenSymbol);
      }
      
      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to get token balances:', error);
      setError('Failed to fetch token balances');
    } finally {
      setLoading(false);
    }
  };
  
  const refreshBalance = async (tokenSymbol: SupportedTokenSymbol) => {
    try {
      const balance = await getTokenBalance(tokenSymbol);
      setBalances(prev => ({
        ...prev,
        [tokenSymbol]: balance
      }));
    } catch (error) {
      console.error(`Failed to refresh ${tokenSymbol} balance:`, error);
    }
  };
  
  useEffect(() => {
    getAllBalances();
  }, [address]);
  
  return {
    balances,
    loading,
    error,
    getAllBalances,
    refreshBalance,
    getTokenBalance,
  };
}
