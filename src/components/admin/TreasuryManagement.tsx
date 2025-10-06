"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTreasuryManagement } from "@/hooks/useTreasuryManagement";
import { toast } from "sonner";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Coins
} from "lucide-react";

interface TreasuryBalanceCardProps {
  currency: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  lastUpdated: Date;
}

function TreasuryBalanceCard({ currency, balance, availableBalance, lockedBalance, lastUpdated }: TreasuryBalanceCardProps) {
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'SUI': return <Coins className="h-5 w-5 text-blue-600" />;
      case 'USDC': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'USDT': return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'NAIRA': return <DollarSign className="h-5 w-5 text-yellow-600" />;
      default: return <Wallet className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatBalance = (amount: number, currency: string) => {
    if (currency === 'NAIRA') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${amount.toLocaleString()} ${currency}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getCurrencyIcon(currency)}
          {currency} Balance
        </CardTitle>
        <Badge variant="outline">
          {lastUpdated.toLocaleTimeString()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {formatBalance(balance, currency)}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Available</p>
              <p className="font-medium text-green-600">
                {formatBalance(availableBalance, currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Locked</p>
              <p className="font-medium text-orange-600">
                {formatBalance(lockedBalance, currency)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TreasuryTransactionRowProps {
  transaction: any;
}

function TreasuryTransactionRow({ transaction }: TreasuryTransactionRowProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'WITHDRAWAL': return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'SWAP_IN': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'SWAP_OUT': return <TrendingDown className="h-4 w-4 text-purple-600" />;
      case 'FEE_COLLECTION': return <DollarSign className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'NAIRA') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${amount.toLocaleString()} ${currency}`;
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {getTransactionIcon(transaction.type)}
          <Badge variant="outline">{transaction.type}</Badge>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(transaction.status)}
          <Badge variant={
            transaction.status === 'COMPLETED' ? 'default' : 
            transaction.status === 'PENDING' ? 'secondary' : 'destructive'
          }>
            {transaction.status}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium">
        {formatAmount(transaction.amount, transaction.currency)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {transaction.description || 'No description'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {transaction.createdAt.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm font-mono">
        {transaction.transactionHash ? 
          `${transaction.transactionHash.slice(0, 8)}...` : 
          'N/A'
        }
      </td>
    </tr>
  );
}

export default function TreasuryManagement() {
  const { 
    balances, 
    transactions, 
    metrics, 
    alerts, 
    refreshAll, 
    triggerMonitoring, 
    triggerCronMonitoring 
  } = useTreasuryManagement();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  // Filter transactions
  const filteredTransactions = transactions.transactions.filter((tx: any) => {
    const currencyMatch = selectedCurrency === "all" || tx.currency === selectedCurrency;
    const typeMatch = selectedType === "all" || tx.type === selectedType;
    return currencyMatch && typeMatch;
  });

  // Filter alerts
  const filteredAlerts = alerts.alerts.filter((alert: any) => {
    const severityMatch = selectedSeverity === "all" || alert.severity === selectedSeverity;
    return severityMatch;
  });

  const handleRefreshBalances = async () => {
    setRefreshing(true);
    try {
      await balances.fetchBalances();
      toast.success('Treasury balances refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh balances');
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
      toast.success('Treasury data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh treasury data');
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerMonitoring = async () => {
    setRefreshing(true);
    try {
      await triggerMonitoring();
    } catch (error) {
      console.error('Monitoring error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerCronMonitoring = async () => {
    setRefreshing(true);
    try {
      await triggerCronMonitoring();
    } catch (error) {
      console.error('Cron monitoring error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Treasury Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalValueUSD.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₦{metrics.totalValueNGN.toLocaleString()} NGN
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.dailyVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.dailyFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Revenue collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Pending operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currency Balances */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Treasury Balances</CardTitle>
              <CardDescription>Real-time balance monitoring across all currencies</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleRefreshBalances}
                disabled={refreshing}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Balances
              </Button>
              <Button 
                onClick={handleRefreshAll}
                disabled={refreshing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
              <Button 
                onClick={handleTriggerMonitoring}
                disabled={refreshing}
                size="sm"
                variant="secondary"
              >
                <Activity className={`h-4 w-4 mr-2 ${refreshing ? 'animate-pulse' : ''}`} />
                Monitor
              </Button>
              <Button 
                onClick={handleTriggerCronMonitoring}
                disabled={refreshing}
                size="sm"
                variant="destructive"
              >
                <Clock className={`h-4 w-4 mr-2 ${refreshing ? 'animate-pulse' : ''}`} />
                Cron Monitor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {balances.loading ? (
            <div className="text-center py-8">Loading treasury balances...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {balances.balances.map((balance: any) => (
                <TreasuryBalanceCard
                  key={balance.currency}
                  currency={balance.currency}
                  balance={balance.balance}
                  availableBalance={balance.availableBalance}
                  lockedBalance={balance.lockedBalance}
                  lastUpdated={balance.lastUpdated}
                />
              ))}
              
              {balances.balances.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No treasury balances found. Click "Refresh Balances" to load data.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treasury Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Treasury Transactions</CardTitle>
          <CardDescription>Recent treasury operations and fund movements</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="currency-filter">Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="All Currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="SUI">SUI</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="NAIRA">NAIRA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="SWAP_IN">Swap In</SelectItem>
                  <SelectItem value="SWAP_OUT">Swap Out</SelectItem>
                  <SelectItem value="FEE_COLLECTION">Fee Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Table */}
          {transactions.loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Description</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction: any) => (
                    <TreasuryTransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </tbody>
              </table>
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found matching your filters
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treasury Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Treasury Alerts</CardTitle>
          <CardDescription>Real-time alerts and notifications for treasury management</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Alert Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="severity-filter">Severity</Label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alerts List */}
          {alerts.loading ? (
            <div className="text-center py-8">Loading alerts...</div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert: any) => (
                <div key={alert.id} className={`p-4 border rounded-lg ${
                  alert.acknowledged ? 'bg-gray-50 border-gray-200' : 
                  alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'HIGH' ? 'bg-orange-50 border-orange-200' :
                  alert.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        alert.severity === 'CRITICAL' ? 'destructive' :
                        alert.severity === 'HIGH' ? 'destructive' :
                        alert.severity === 'MEDIUM' ? 'secondary' :
                        'outline'
                      }>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">{alert.type}</Badge>
                      {alert.acknowledged && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {alert.createdAt.toLocaleString()}
                      </span>
                      {!alert.acknowledged && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => alerts.acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">{alert.message}</p>
                    {alert.currency && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Currency: {alert.currency} | Amount: {alert.amount?.toLocaleString()} | Threshold: {alert.threshold?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredAlerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No alerts found matching your filters
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
