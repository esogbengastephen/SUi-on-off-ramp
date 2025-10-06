import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// SUI RPC URL - you can configure this in your environment
const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';

// Initialize Sui client
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

// Token addresses on Sui testnet
const TOKEN_ADDRESSES = {
  SUI: '0x2::sui::SUI',
  USDC: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC', // Testnet USDC
  USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN' // Testnet USDT
};

export interface WalletBalances {
  sui: number;
  usdc: number;
  usdt: number;
}

export interface WalletValidationResult {
  canProceed: boolean;
  errorMessage?: string;
  balances: WalletBalances;
  required: {
    swapToken: number;
    gasFee: number;
  };
}

/**
 * Get SUI balance for a user address
 */
export async function getSuiBalance(userAddress: string): Promise<number> {
  try {
    const balance = await suiClient.getBalance({
      owner: userAddress,
      coinType: TOKEN_ADDRESSES.SUI
    });
    
    // Convert from MIST to SUI (1 SUI = 1e9 MIST)
    return parseFloat(balance.totalBalance) / 1e9;
  } catch (error) {
    console.error('Error getting SUI balance:', error);
    return 0;
  }
}

/**
 * Get USDC balance for a user address
 */
export async function getUsdcBalance(userAddress: string): Promise<number> {
  try {
    const balance = await suiClient.getBalance({
      owner: userAddress,
      coinType: TOKEN_ADDRESSES.USDC
    });
    
    // USDC has 6 decimals
    return parseFloat(balance.totalBalance) / 1e6;
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return 0;
  }
}

/**
 * Get USDT balance for a user address
 */
export async function getUsdtBalance(userAddress: string): Promise<number> {
  try {
    const balance = await suiClient.getBalance({
      owner: userAddress,
      coinType: TOKEN_ADDRESSES.USDT
    });
    
    // USDT has 6 decimals
    return parseFloat(balance.totalBalance) / 1e6;
  } catch (error) {
    console.error('Error getting USDT balance:', error);
    return 0;
  }
}

/**
 * Get all token balances for a user address
 */
export async function getAllTokenBalances(userAddress: string): Promise<WalletBalances> {
  try {
    const [suiBalance, usdcBalance, usdtBalance] = await Promise.all([
      getSuiBalance(userAddress),
      getUsdcBalance(userAddress),
      getUsdtBalance(userAddress)
    ]);

    return {
      sui: suiBalance,
      usdc: usdcBalance,
      usdt: usdtBalance
    };
  } catch (error) {
    console.error('Error getting all token balances:', error);
    return {
      sui: 0,
      usdc: 0,
      usdt: 0
    };
  }
}

/**
 * Estimate gas fee for OFF-RAMP transaction
 * This is a simplified estimation - in production you'd want more accurate estimation
 */
export async function estimateGasFee(transactionType: 'OFF_RAMP'): Promise<number> {
  try {
    // For OFF-RAMP transactions, we estimate gas fee based on:
    // - Transfer token to treasury
    // - Update transaction status
    // - Emit events
    
    // Base gas fee estimation (this should be updated with actual estimation)
    const baseGasFee = 0.01; // 0.01 SUI base fee
    
    // Add buffer for safety
    const gasBuffer = 0.005; // 0.005 SUI buffer
    
    return baseGasFee + gasBuffer;
  } catch (error) {
    console.error('Error estimating gas fee:', error);
    return 0.015; // Default fallback gas fee
  }
}

/**
 * Validate user wallet for OFF-RAMP transaction
 */
export async function validateUserWalletForOffRamp(
  userAddress: string,
  tokenType: 'SUI' | 'USDC' | 'USDT',
  swapAmount: number
): Promise<WalletValidationResult> {
  try {
    console.log('Starting validation for:', { userAddress, tokenType, swapAmount });
    
    const balances = await getAllTokenBalances(userAddress);
    console.log('Retrieved balances:', balances);
    
    const estimatedGasFee = await estimateGasFee('OFF_RAMP');
    console.log('Estimated gas fee:', estimatedGasFee);

    switch (tokenType) {
      case 'SUI':
        const requiredSui = swapAmount + estimatedGasFee;
        const suiResult = {
          canProceed: balances.sui >= requiredSui,
          errorMessage: balances.sui < requiredSui 
            ? 'Insufficient SUI for swap and gas fees' 
            : undefined,
          balances,
          required: { swapToken: swapAmount, gasFee: estimatedGasFee }
        };
        console.log('SUI validation result:', suiResult);
        return suiResult;

      case 'USDC':
        const usdcResult = {
          canProceed: balances.usdc >= swapAmount && balances.sui >= estimatedGasFee,
          errorMessage: balances.usdc < swapAmount 
            ? 'Insufficient USDC for swap' 
            : balances.sui < estimatedGasFee 
            ? 'Insufficient gas fee to complete transaction' 
            : undefined,
          balances,
          required: { swapToken: swapAmount, gasFee: estimatedGasFee }
        };
        console.log('USDC validation result:', usdcResult);
        return usdcResult;

      case 'USDT':
        const usdtResult = {
          canProceed: balances.usdt >= swapAmount && balances.sui >= estimatedGasFee,
          errorMessage: balances.usdt < swapAmount 
            ? 'Insufficient USDT for swap' 
            : balances.sui < estimatedGasFee 
            ? 'Insufficient gas fee to complete transaction' 
            : undefined,
          balances,
          required: { swapToken: swapAmount, gasFee: estimatedGasFee }
        };
        console.log('USDT validation result:', usdtResult);
        return usdtResult;

      default:
        return {
          canProceed: false,
          errorMessage: 'Invalid token type',
          balances,
          required: { swapToken: swapAmount, gasFee: estimatedGasFee }
        };
    }
  } catch (error) {
    console.error('Error validating wallet for OFF-RAMP:', error);
    return {
      canProceed: false,
      errorMessage: 'Error checking wallet balance',
      balances: { sui: 0, usdc: 0, usdt: 0 },
      required: { swapToken: swapAmount, gasFee: 0.015 }
    };
  }
}

/**
 * Check if user has sufficient SUI for gas fees only
 */
export async function hasSufficientGasFee(userAddress: string): Promise<{
  hasSufficient: boolean;
  suiBalance: number;
  estimatedGasFee: number;
}> {
  try {
    const suiBalance = await getSuiBalance(userAddress);
    const estimatedGasFee = await estimateGasFee('OFF_RAMP');
    
    return {
      hasSufficient: suiBalance >= estimatedGasFee,
      suiBalance,
      estimatedGasFee
    };
  } catch (error) {
    console.error('Error checking gas fee sufficiency:', error);
    return {
      hasSufficient: false,
      suiBalance: 0,
      estimatedGasFee: 0.015
    };
  }
}
