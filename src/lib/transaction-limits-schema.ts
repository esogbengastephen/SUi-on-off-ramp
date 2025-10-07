// Transaction limits schema for Firebase
export interface TransactionLimits {
  id: string;
  
  // On-ramp limits (Naira to SUI/USDC/USDT)
  onRamp: {
    minNairaAmount: number;        // Minimum Naira amount
    maxNairaAmount: number;        // Maximum Naira amount
    minSuiAmount: number;          // Minimum SUI amount
    maxSuiAmount: number;          // Maximum SUI amount
    minUsdcAmount: number;         // Minimum USDC amount
    maxUsdcAmount: number;         // Maximum USDC amount
    minUsdtAmount: number;         // Minimum USDT amount
    maxUsdtAmount: number;         // Maximum USDT amount
  };
  
  // Off-ramp limits (SUI/USDC/USDT to Naira)
  offRamp: {
    minNairaAmount: number;        // Minimum Naira amount
    maxNairaAmount: number;        // Maximum Naira amount
    minSuiAmount: number;          // Minimum SUI amount
    maxSuiAmount: number;          // Maximum SUI amount
    minUsdcAmount: number;         // Minimum USDC amount
    maxUsdcAmount: number;         // Maximum USDC amount
    minUsdtAmount: number;         // Minimum USDT amount
    maxUsdtAmount: number;         // Maximum USDT amount
  };
  
  // General settings
  isActive: boolean;               // Whether limits are active
  lastUpdated: Date;               // Last update timestamp
  updatedBy: string;               // Admin who updated the limits
  version: number;                  // Version number for tracking changes
}

// Default limits
export const DEFAULT_TRANSACTION_LIMITS: TransactionLimits = {
  id: 'default',
  onRamp: {
    minNairaAmount: 1000,          // ₦1,000 minimum
    maxNairaAmount: 1000000,       // ₦1,000,000 maximum
    minSuiAmount: 0.1,             // 0.1 SUI minimum
    maxSuiAmount: 1000,            // 1000 SUI maximum
    minUsdcAmount: 1,               // 1 USDC minimum
    maxUsdcAmount: 10000,          // 10,000 USDC maximum
    minUsdtAmount: 1,               // 1 USDT minimum
    maxUsdtAmount: 10000,          // 10,000 USDT maximum
  },
  offRamp: {
    minNairaAmount: 1000,          // ₦1,000 minimum
    maxNairaAmount: 1000000,       // ₦1,000,000 maximum
    minSuiAmount: 0.1,             // 0.1 SUI minimum
    maxSuiAmount: 1000,            // 1000 SUI maximum
    minUsdcAmount: 1,               // 1 USDC minimum
    maxUsdcAmount: 10000,          // 10,000 USDC maximum
    minUsdtAmount: 1,               // 1 USDT minimum
    maxUsdtAmount: 10000,          // 10,000 USDT maximum
  },
  isActive: true,
  lastUpdated: new Date(),
  updatedBy: 'system',
  version: 1
};

// Validation result
export interface LimitValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Transaction type
export type TransactionType = 'on_ramp' | 'off_ramp';

// Token type
export type TokenType = 'SUI' | 'USDC' | 'USDT' | 'NAIRA';
