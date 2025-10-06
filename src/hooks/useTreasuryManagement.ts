"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface TreasuryBalance {
  currency: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  lastUpdated: Date;
}

export interface TreasuryTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'SWAP_IN' | 'SWAP_OUT' | 'FEE_COLLECTION';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  description?: string;
  transactionHash?: string;
  createdAt: Date;
}

export interface TreasuryMetrics {
  totalValueUSD: number;
  totalValueNGN: number;
  dailyVolume: number;
  dailyFees: number;
  activeTransactions: number;
}

export interface TreasuryAlert {
  id: string;
  type: 'LOW_BALANCE' | 'HIGH_VOLUME' | 'FAILED_TRANSACTION' | 'SYSTEM_ERROR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  currency?: string;
  amount?: number;
  threshold?: number;
  createdAt: Date;
  acknowledged: boolean;
}

export function useTreasuryBalances() {
  const [balances, setBalances] = useState<TreasuryBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBalances = useCallback(async () => {
    try {
      console.log('🚀 TREASURY BALANCES: Fetching treasury balances');
      
      const response = await fetch('/api/admin/treasury/balance');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch treasury balances');
      }

      const treasuryBalances: TreasuryBalance[] = data.balances.map((balance: any) => ({
        currency: balance.currency,
        balance: balance.balance,
        availableBalance: balance.availableBalance,
        lockedBalance: balance.lockedBalance,
        lastUpdated: new Date(balance.lastUpdated)
      }));

      setBalances(treasuryBalances);
      setLastUpdated(new Date());
      setError(null);
      
      console.log('✅ TREASURY BALANCES: Successfully fetched balances:', treasuryBalances);
    } catch (err: any) {
      console.error('❌ TREASURY BALANCES: Error fetching balances:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBalance = useCallback(async (currency: string, updates: Partial<TreasuryBalance>) => {
    try {
      console.log('🚀 TREASURY BALANCES: Updating balance for', currency, updates);
      
      const response = await fetch('/api/admin/treasury/balance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency,
          ...updates
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update balance');
      }

      // Refresh balances after update
      await fetchBalances();
      
      console.log('✅ TREASURY BALANCES: Successfully updated balance');
    } catch (err: any) {
      console.error('❌ TREASURY BALANCES: Error updating balance:', err);
      toast.error(`Failed to update ${currency} balance: ${err.message}`);
    }
  }, [fetchBalances]);

  // Auto-refresh balances every 30 seconds
  useEffect(() => {
    fetchBalances();
    
    const interval = setInterval(fetchBalances, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return { 
    balances, 
    loading, 
    error, 
    lastUpdated,
    fetchBalances,
    updateBalance
  };
}

export function useTreasuryTransactions() {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      console.log('🚀 TREASURY TRANSACTIONS: Fetching treasury transactions');
      
      const response = await fetch('/api/admin/treasury/transactions');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch treasury transactions');
      }

      const treasuryTransactions: TreasuryTransaction[] = data.transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        transactionHash: tx.transactionHash,
        createdAt: new Date(tx.createdAt)
      }));

      setTransactions(treasuryTransactions);
          setError(null);
      
      console.log('✅ TREASURY TRANSACTIONS: Successfully fetched transactions:', treasuryTransactions.length);
    } catch (err: any) {
      console.error('❌ TREASURY TRANSACTIONS: Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh transactions every 60 seconds
  useEffect(() => {
    fetchTransactions();
    
    const interval = setInterval(fetchTransactions, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  return { 
    transactions, 
    loading, 
    error, 
    fetchTransactions
  };
}

export function useTreasuryMetrics() {
  const [metrics, setMetrics] = useState<TreasuryMetrics>({
    totalValueUSD: 0,
    totalValueNGN: 0,
    dailyVolume: 0,
    dailyFees: 0,
    activeTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      console.log('🚀 TREASURY METRICS: Fetching treasury metrics');
      
      const response = await fetch('/api/admin/treasury/metrics');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch treasury metrics');
      }

      setMetrics(data.metrics);
      setError(null);
      
      console.log('✅ TREASURY METRICS: Successfully fetched metrics:', data.metrics);
    } catch (err: any) {
      console.error('❌ TREASURY METRICS: Error fetching metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh metrics every 2 minutes
  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    fetchMetrics
  };
}

export function useTreasuryAlerts() {
  const [alerts, setAlerts] = useState<TreasuryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      console.log('🚀 TREASURY ALERTS: Fetching treasury alerts');
      
      const response = await fetch('/api/admin/treasury/alerts');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch treasury alerts');
      }

      const treasuryAlerts: TreasuryAlert[] = data.alerts.map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        currency: alert.currency,
        amount: alert.amount,
        threshold: alert.threshold,
        createdAt: new Date(alert.createdAt),
        acknowledged: alert.acknowledged
      }));

      setAlerts(treasuryAlerts);
      setError(null);
      
      console.log('✅ TREASURY ALERTS: Successfully fetched alerts:', treasuryAlerts.length);
    } catch (err: any) {
      console.error('❌ TREASURY ALERTS: Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      console.log('🚀 TREASURY ALERTS: Acknowledging alert:', alertId);
      
      const response = await fetch('/api/admin/treasury/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          acknowledged: true
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to acknowledge alert');
      }

      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
      
      console.log('✅ TREASURY ALERTS: Successfully acknowledged alert');
    } catch (err: any) {
      console.error('❌ TREASURY ALERTS: Error acknowledging alert:', err);
      toast.error(`Failed to acknowledge alert: ${err.message}`);
    }
  }, []);

  const createAlert = useCallback(async (alert: Omit<TreasuryAlert, 'id' | 'createdAt' | 'acknowledged'>) => {
    try {
      console.log('🚀 TREASURY ALERTS: Creating alert:', alert);
      
      const response = await fetch('/api/admin/treasury/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create alert');
      }

      // Refresh alerts
      await fetchAlerts();
      
      console.log('✅ TREASURY ALERTS: Successfully created alert');
    } catch (err: any) {
      console.error('❌ TREASURY ALERTS: Error creating alert:', err);
      toast.error(`Failed to create alert: ${err.message}`);
    }
  }, [fetchAlerts]);

  // Auto-refresh alerts every 30 seconds
  useEffect(() => {
    fetchAlerts();
    
    const interval = setInterval(fetchAlerts, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    acknowledgeAlert,
    createAlert
  };
}

// Combined hook for comprehensive treasury management
export function useTreasuryManagement() {
  const balances = useTreasuryBalances();
  const transactions = useTreasuryTransactions();
  const metrics = useTreasuryMetrics();
  const alerts = useTreasuryAlerts();

  const refreshAll = useCallback(async () => {
    console.log('🚀 TREASURY MANAGEMENT: Refreshing all treasury data');
    
    await Promise.all([
      balances.fetchBalances(),
      transactions.fetchTransactions(),
      metrics.fetchMetrics(),
      alerts.fetchAlerts()
    ]);
    
    console.log('✅ TREASURY MANAGEMENT: All treasury data refreshed');
  }, [balances.fetchBalances, transactions.fetchTransactions, metrics.fetchMetrics, alerts.fetchAlerts]);

  const checkLowBalanceAlerts = useCallback(() => {
    console.log('🚀 TREASURY MANAGEMENT: Checking for low balance alerts');
    
    const LOW_BALANCE_THRESHOLDS = {
      'SUI': 100,
      'USDC': 1000,
      'USDT': 1000,
      'NAIRA': 100000
    };

    balances.balances.forEach(balance => {
      const threshold = LOW_BALANCE_THRESHOLDS[balance.currency as keyof typeof LOW_BALANCE_THRESHOLDS];
      
      if (threshold && balance.availableBalance < threshold) {
        const existingAlert = alerts.alerts.find(alert => 
          alert.type === 'LOW_BALANCE' && 
          alert.currency === balance.currency && 
          !alert.acknowledged
        );

        if (!existingAlert) {
          const severity = balance.availableBalance < threshold * 0.5 ? 'CRITICAL' : 'HIGH';
          
          alerts.createAlert({
            type: 'LOW_BALANCE',
            severity,
            message: `${severity === 'CRITICAL' ? 'CRITICAL' : 'Low'} ${balance.currency} balance: ${balance.availableBalance.toLocaleString()} (threshold: ${threshold.toLocaleString()})`,
            currency: balance.currency,
            amount: balance.availableBalance,
            threshold
          });
        }
      }
    });
  }, [balances.balances, alerts.alerts, alerts.createAlert]);

  const triggerMonitoring = useCallback(async () => {
    try {
      console.log('🚀 TREASURY MANAGEMENT: Triggering manual monitoring');
      
      const response = await fetch('/api/admin/treasury/monitoring');
      const data = await response.json();

      if (data.success) {
        console.log('✅ TREASURY MANAGEMENT: Manual monitoring completed');
        toast.success(`Monitoring completed. ${data.alertsCreated} alerts created.`);
        
        // Refresh all data after monitoring
        await refreshAll();
      } else {
        throw new Error(data.error || 'Monitoring failed');
      }
    } catch (error: any) {
      console.error('❌ TREASURY MANAGEMENT: Error triggering monitoring:', error);
      toast.error(`Monitoring failed: ${error.message}`);
    }
  }, [refreshAll]);

  const triggerCronMonitoring = useCallback(async () => {
    try {
      console.log('🚀 TREASURY MANAGEMENT: Triggering cron monitoring');
      
      const response = await fetch('/api/admin/treasury/cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true })
      });
      
      const data = await response.json();

      if (data.success) {
        console.log('✅ TREASURY MANAGEMENT: Cron monitoring completed');
        toast.success(`Cron monitoring completed. ${data.alertsCreated} alerts created.`);
        
        // Refresh all data after monitoring
        await refreshAll();
      } else {
        throw new Error(data.error || 'Cron monitoring failed');
      }
    } catch (error: any) {
      console.error('❌ TREASURY MANAGEMENT: Error triggering cron monitoring:', error);
      toast.error(`Cron monitoring failed: ${error.message}`);
    }
  }, [refreshAll]);

  // Check for low balance alerts whenever balances change
  useEffect(() => {
    if (balances.balances.length > 0) {
      checkLowBalanceAlerts();
    }
  }, [balances.balances, checkLowBalanceAlerts]);

  return {
    balances,
    transactions,
    metrics,
    alerts,
    refreshAll,
    checkLowBalanceAlerts,
    triggerMonitoring,
    triggerCronMonitoring
  };
}