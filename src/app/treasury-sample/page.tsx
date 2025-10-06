"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Coins,
  Users,
  BarChart3,
  PieChart
} from "lucide-react";

// Sample data for demonstration
const sampleBalances = [
  {
    currency: 'SUI',
    balance: 1250.75,
    availableBalance: 1200.00,
    lockedBalance: 50.75,
    walletAddress: '0x011b73c8307e2917677c6b281a47118ed1768d9e34a147368d477714e9e132f9',
    contractAddress: '0xb5a494a7253e5030ba0ab012f268eedccfd9338f4ed1698c2a6b28324cc1f2c9',
    lastUpdated: new Date()
  },
  {
    currency: 'USDC',
    balance: 50000.00,
    availableBalance: 48000.00,
    lockedBalance: 2000.00,
    walletAddress: '0x011b73c8307e2917677c6b281a47118ed1768d9e34a147368d477714e9e132f9',
    lastUpdated: new Date()
  },
  {
    currency: 'USDT',
    balance: 25000.00,
    availableBalance: 24000.00,
    lockedBalance: 1000.00,
    walletAddress: '0x011b73c8307e2917677c6b281a47118ed1768d9e34a147368d477714e9e132f9',
    lastUpdated: new Date()
  },
  {
    currency: 'NAIRA',
    balance: 75000000.00,
    availableBalance: 70000000.00,
    lockedBalance: 5000000.00,
    lastUpdated: new Date()
  }
];

const sampleTransactions = [
  {
    id: 'tx_1',
    type: 'DEPOSIT',
    currency: 'SUI',
    amount: 1000,
    status: 'COMPLETED',
    description: 'Initial treasury deposit',
    transactionHash: '0x1234567890abcdef',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    id: 'tx_2',
    type: 'SWAP_IN',
    currency: 'USDC',
    amount: 5000,
    status: 'COMPLETED',
    description: 'Swap transaction completed',
    transactionHash: '0xabcdef1234567890',
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    id: 'tx_3',
    type: 'FEE_COLLECTION',
    currency: 'NAIRA',
    amount: 50000,
    status: 'COMPLETED',
    description: 'Transaction fee collected',
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 1800000)
  },
  {
    id: 'tx_4',
    type: 'WITHDRAWAL',
    currency: 'USDT',
    amount: 2000,
    status: 'PENDING',
    description: 'Pending withdrawal request',
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
    updatedAt: new Date(Date.now() - 300000)
  }
];

const sampleMetrics = {
  totalValueUSD: 125000,
  totalValueNGN: 187500000,
  dailyVolume: 15000,
  dailyFees: 750,
  activeTransactions: 3,
  last24HoursDeposits: 25000,
  last24HoursWithdrawals: 10000
};

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

interface TransactionRowProps {
  transaction: any;
}

function TransactionRow({ transaction }: TransactionRowProps) {
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

export default function TreasuryManagementSample() {
  const [balances] = useState(sampleBalances);
  const [transactions] = useState(sampleTransactions);
  const [metrics] = useState(sampleMetrics);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const currencyMatch = selectedCurrency === "all" || tx.currency === selectedCurrency;
    const typeMatch = selectedType === "all" || tx.type === selectedType;
    return currencyMatch && typeMatch;
  });

  const handleRefreshBalances = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Treasury balances refreshed successfully');
    } catch (error) {
      toast.error('Error refreshing balances');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Treasury Management System</h1>
        <p className="text-muted-foreground">
          Real-time treasury balance monitoring and transaction management
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common treasury management operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleRefreshBalances} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Balances
                </Button>
                <Button variant="outline">
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  Add Deposit
                </Button>
                <Button variant="outline">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Process Withdrawal
                </Button>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Treasury Balances</CardTitle>
                  <CardDescription>Real-time balance monitoring across all currencies</CardDescription>
                </div>
                <Button 
                  onClick={handleRefreshBalances}
                  disabled={refreshing}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {balances.map((balance) => (
                  <TreasuryBalanceCard
                    key={balance.currency}
                    currency={balance.currency}
                    balance={balance.balance}
                    availableBalance={balance.availableBalance}
                    lockedBalance={balance.lockedBalance}
                    lastUpdated={balance.lastUpdated}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
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
                    {filteredTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Balance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {balances.map((balance) => {
                    const percentage = (balance.balance / balances.reduce((sum, b) => sum + b.balance, 0)) * 100;
                    return (
                      <div key={balance.currency} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{balance.currency}</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Transaction Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Deposits (24h)</span>
                    <span className="font-medium">${metrics.last24HoursDeposits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Withdrawals (24h)</span>
                    <span className="font-medium">${metrics.last24HoursWithdrawals.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Flow (24h)</span>
                    <span className={`font-medium ${metrics.last24HoursDeposits > metrics.last24HoursWithdrawals ? 'text-green-600' : 'text-red-600'}`}>
                      ${(metrics.last24HoursDeposits - metrics.last24HoursWithdrawals).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee Revenue (24h)</span>
                    <span className="font-medium text-yellow-600">${metrics.dailyFees.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
