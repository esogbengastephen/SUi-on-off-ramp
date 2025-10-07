/**
 * Firebase Admin Data Architecture
 * Comprehensive schema for admin dashboard data persistence
 */

// ===== ADMIN MANAGEMENT =====

export interface AdminUser {
  id?: string;
  walletAddress: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'TRANSACTION_ADMIN' | 'VIEWER_ADMIN';
  permissions: AdminPermissions;
  enrolledBy: string; // wallet address of enrolling admin
  enrolledAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminPermissions {
  canViewTransactions: boolean;
  canApproveTransactions: boolean;
  canRejectTransactions: boolean;
  canManageUsers: boolean;
  canManageTreasury: boolean;
  canViewAnalytics: boolean;
  canManageAdmins: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
}

export interface AdminSession {
  id?: string;
  adminWalletAddress: string;
  sessionId: string;
  loginAt: Date;
  logoutAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface AdminActivity {
  id?: string;
  adminWalletAddress: string;
  action: AdminActionType;
  targetType: 'TRANSACTION' | 'USER' | 'TREASURY' | 'ADMIN' | 'SYSTEM';
  targetId: string;
  details: any;
  timestamp: Date;
  ipAddress?: string;
}

export type AdminActionType = 
  | 'LOGIN' | 'LOGOUT'
  | 'APPROVE_TRANSACTION' | 'REJECT_TRANSACTION' | 'OVERRIDE_TRANSACTION'
  | 'BLOCK_USER' | 'UNBLOCK_USER' | 'UPDATE_USER_LIMITS'
  | 'TREASURY_DEPOSIT' | 'TREASURY_WITHDRAWAL' | 'TREASURY_REBALANCE'
  | 'ENROLL_ADMIN' | 'DEACTIVATE_ADMIN' | 'UPDATE_ADMIN_ROLE'
  | 'UPDATE_SETTINGS' | 'EXPORT_DATA' | 'GENERATE_REPORT';

// ===== TREASURY MANAGEMENT =====

export interface TreasurySnapshot {
  id?: string;
  timestamp: Date;
  balances: {
    SUI: TreasuryTokenBalance;
    USDC: TreasuryTokenBalance;
    USDT: TreasuryTokenBalance;
    NAIRA: TreasuryTokenBalance;
  };
  totalValueUSD: number;
  totalValueNGN: number;
  healthScore: number; // 0-100
  alerts: TreasuryAlert[];
}

export interface TreasuryTokenBalance {
  available: number;
  locked: number;
  total: number;
  reservePercentage: number;
  demandScore: number; // 0-100 based on recent activity
  lastUpdated: Date;
}

export interface TreasuryAlert {
  id?: string;
  type: 'LOW_BALANCE' | 'HIGH_DEMAND' | 'SYSTEM_ERROR' | 'MANUAL_INTERVENTION_REQUIRED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currency?: string;
  message: string;
  threshold?: number;
  currentValue?: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface TreasuryOperation {
  id?: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'REBALANCE' | 'EMERGENCY_STOP';
  currency: string;
  amount: number;
  fromAddress?: string;
  toAddress?: string;
  transactionHash?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'FAILED';
  initiatedBy: string; // admin wallet address
  approvedBy?: string; // for high-value operations
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== TRANSACTION MANAGEMENT =====

export interface TransactionOverride {
  id?: string;
  transactionId: string;
  originalStatus: string;
  newStatus: string;
  reason: string;
  adminWalletAddress: string;
  adminNote?: string;
  userNotified: boolean;
  createdAt: Date;
}

export interface BulkOperation {
  id?: string;
  operationType: 'APPROVE' | 'REJECT' | 'EXPORT' | 'UPDATE_STATUS';
  transactionIds: string[];
  criteria: any; // filter criteria used
  adminWalletAddress: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  results: {
    successful: number;
    failed: number;
    errors: string[];
  };
  createdAt: Date;
  completedAt?: Date;
}

// ===== USER MANAGEMENT =====

export interface UserProfile {
  id?: string;
  walletAddress: string;
  email?: string;
  phone?: string;
  referralCode?: string;
  referredBy?: string;
  transactionLimits: UserLimits;
  riskScore: number; // 0-100
  isBlocked: boolean;
  blockedBy?: string;
  blockedAt?: Date;
  blockReason?: string;
  totalTransactions: number;
  totalVolume: number;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLimits {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface UserActivity {
  id?: string;
  userWalletAddress: string;
  activityType: 'LOGIN' | 'TRANSACTION_INITIATED' | 'TRANSACTION_COMPLETED' | 'KYC_SUBMITTED';
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ===== ANALYTICS & REPORTING =====

export interface DailyAnalytics {
  id?: string;
  date: string; // YYYY-MM-DD
  metrics: {
    totalTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    totalVolume: number;
    totalRevenue: number;
    onRampVolume: number;
    offRampVolume: number;
    newUsers: number;
    activeUsers: number;
    averageTransactionSize: number;
  };
  treasuryMetrics: {
    totalValueUSD: number;
    totalValueNGN: number;
    tokenDistribution: Record<string, number>;
    rebalanceOperations: number;
  };
  systemMetrics: {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    alertsGenerated: number;
  };
  createdAt: Date;
}

export interface CustomReport {
  id?: string;
  name: string;
  description?: string;
  reportType: 'FINANCIAL' | 'OPERATIONAL' | 'USER_ACTIVITY' | 'TREASURY' | 'CUSTOM';
  parameters: any;
  schedule?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recipients: string[]; // email addresses
  lastGenerated?: Date;
  nextScheduled?: Date;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExecution {
  id?: string;
  reportId: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  format: 'PDF' | 'CSV' | 'EXCEL';
  filePath?: string;
  downloadUrl?: string;
  generatedBy: string;
  parameters: any;
  executionTime: number; // milliseconds
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ===== SYSTEM CONFIGURATION =====

export interface AdminSettings {
  id?: string;
  category: 'GENERAL' | 'TREASURY' | 'ALERTS' | 'SECURITY' | 'REPORTING';
  key: string;
  value: any;
  description?: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface SystemAlert {
  id?: string;
  type: 'SYSTEM_ERROR' | 'SECURITY_BREACH' | 'MAINTENANCE' | 'PERFORMANCE' | 'CUSTOM';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  affectedSystems: string[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface NotificationTemplate {
  id?: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject?: string;
  template: string;
  variables: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== FIREBASE COLLECTIONS =====

export const ADMIN_COLLECTIONS = {
  // Admin Management
  ADMIN_USERS: 'adminUsers',
  ADMIN_SESSIONS: 'adminSessions',
  ADMIN_ACTIVITIES: 'adminActivities',
  
  // Treasury Management
  TREASURY_SNAPSHOTS: 'treasurySnapshots',
  TREASURY_ALERTS: 'treasuryAlerts',
  TREASURY_OPERATIONS: 'treasuryOperations',
  
  // Transaction Management
  TRANSACTION_OVERRIDES: 'transactionOverrides',
  BULK_OPERATIONS: 'bulkOperations',
  
  // User Management
  USER_PROFILES: 'userProfiles',
  USER_ACTIVITIES: 'userActivities',
  
  // Analytics & Reporting
  DAILY_ANALYTICS: 'dailyAnalytics',
  CUSTOM_REPORTS: 'customReports',
  REPORT_EXECUTIONS: 'reportExecutions',
  
  // System Configuration
  ADMIN_SETTINGS: 'adminSettings',
  SYSTEM_ALERTS: 'systemAlerts',
  NOTIFICATION_TEMPLATES: 'notificationTemplates',
  
  // Existing Collections (for reference)
  TRANSACTIONS: 'transactions',
  USERS: 'users',
  PAYMENTS: 'payments',
  AUDIT_LOGS: 'auditLogs',
  SYSTEM_HEALTH: 'systemHealth',
  TREASURY_BALANCES: 'treasuryBalances',
  TREASURY_TRANSACTIONS: 'treasuryTransactions'
} as const;

// ===== HELPER TYPES =====

export type AdminCollectionName = keyof typeof ADMIN_COLLECTIONS;

export interface FirebaseDocument {
  id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterCriteria {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains';
  value: any;
}
