"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTreasuryManagement } from "@/hooks/useTreasuryManagement";
import { useTreasurySnapshots, useTreasuryAlerts } from "@/hooks/useFirebaseAdmin";
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
  Activity,
  PieChart,
  BarChart3,
  AlertTriangle
} from "lucide-react";

// Enhanced Token Balance Card with crypto-style design
interface EnhancedTokenBalanceCardProps {
  currency: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  demandScore: number;
  onRampTotal: number;
  offRampTotal: number;
  lastUpdated: Date;
}

function EnhancedTokenBalanceCard({ 
  currency, 
  balance, 
  availableBalance, 
  lockedBalance, 
  demandScore,
  onRampTotal,
  offRampTotal,
  lastUpdated 
}: EnhancedTokenBalanceCardProps) {
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'SUI': return <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">S</div>;
      case 'USDC': return <DollarSign className="h-8 w-8 text-green-400" />;
      case 'USDT': return <DollarSign className="h-8 w-8 text-blue-400" />;
      case 'NAIRA': return <DollarSign className="h-8 w-8 text-yellow-400" />;
      default: return <Wallet className="h-8 w-8 text-gray-400" />;
    }
  };

  const formatBalance = (amount: number, currency: string) => {
    if (currency === 'NAIRA') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getDemandColor = (score: number) => {
    if (score >= 80) return "from-green-400 to-green-600";
    if (score >= 60) return "from-yellow-400 to-yellow-600";
    if (score >= 40) return "from-orange-400 to-orange-600";
    return "from-red-400 to-red-600";
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getCurrencyIcon(currency)}
            <div>
              <CardTitle className="text-white text-lg">{currency}</CardTitle>
              <p className="text-slate-400 text-xs">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-slate-300 border-slate-600">
            {demandScore}% demand
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Balance */}
        <div>
          <p className="text-slate-400 text-sm">Total Balance</p>
          <p className="text-white text-2xl font-bold">{formatBalance(balance, currency)}</p>
        </div>
        
        {/* Available vs Locked */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-3">
            <p className="text-slate-400 text-xs">Available</p>
            <p className="text-green-400 font-semibold">{formatBalance(availableBalance, currency)}</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3">
            <p className="text-slate-400 text-xs">Locked</p>
            <p className="text-orange-400 font-semibold">{formatBalance(lockedBalance, currency)}</p>
          </div>
        </div>

        {/* ON-RAMP vs OFF-RAMP Breakdown */}
        <div className="space-y-2">
          <p className="text-slate-300 text-sm font-medium">Transaction Breakdown</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
              <div className="flex items-center space-x-1">
                <ArrowDownLeft className="h-3 w-3 text-green-400" />
                <p className="text-green-400 text-xs">ON-RAMP</p>
              </div>
              <p className="text-green-300 text-sm font-semibold">{formatBalance(onRampTotal, currency)}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-3 w-3 text-blue-400" />
                <p className="text-blue-400 text-xs">OFF-RAMP</p>
              </div>
              <p className="text-blue-300 text-sm font-semibold">{formatBalance(offRampTotal, currency)}</p>
            </div>
          </div>
        </div>
        
        {/* Demand Score Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Demand Score</span>
            <span>{demandScore}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${getDemandColor(demandScore)} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${demandScore}%` }}
            />
          </div>
        </div>

        {/* Reserve Recommendation */}
        {demandScore > 80 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <p className="text-yellow-300 text-xs">High demand - consider restocking</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Treasury Analytics Chart Component
function TreasuryAnalyticsChart() {
  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Treasury Flow Analytics</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          24-hour treasury inflow and outflow analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Treasury analytics chart will be implemented here</p>
            <p className="text-sm">Real-time flow visualization</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Token Distribution Pie Chart
function TokenDistributionChart({ balances }: { balances: any[] }) {
  const totalValue = balances.reduce((sum, balance) => sum + balance.balance, 0);
  
  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <PieChart className="h-5 w-5" />
          <span>Token Distribution</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Current treasury allocation by token
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.map((balance, index) => {
            const percentage = totalValue > 0 ? (balance.balance / totalValue) * 100 : 0;
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
            
            return (
              <div key={balance.currency} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-white">{balance.currency}</span>
                  </div>
                  <span className="text-slate-300">{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Treasury Dashboard Component
export default function TreasuryDashboard() {
  const { 
    balances, 
    transactions, 
    metrics, 
    alerts, 
    refreshAll, 
    triggerMonitoring 
  } = useTreasuryManagement();
  
  const { snapshots, latestSnapshot } = useTreasurySnapshots();
  const { alerts: firebaseAlerts, unacknowledgedCount } = useTreasuryAlerts();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Real treasury data from Firebase
  const enhancedBalances = balances?.balances ? 
    Object.entries(balances.balances).map(([currency, data]: [string, any]) => ({
      currency,
      balance: data.total || 0,
      availableBalance: data.available || 0,
      lockedBalance: data.locked || 0,
      demandScore: data.demandScore || 0,
      onRampTotal: data.onRampTotal || 0,
      offRampTotal: data.offRampTotal || 0,
      lastUpdated: data.lastUpdated || new Date()
    })) : [];

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

  // Filter transactions
  const filteredTransactions = transactions.transactions.filter((tx: any) => {
    const currencyMatch = selectedCurrency === "all" || tx.currency === selectedCurrency;
    const typeMatch = selectedType === "all" || tx.type === selectedType;
    return currencyMatch && typeMatch;
  });

  return (
    <div className="space-y-8">
      {/* Treasury Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Value (USD)</p>
                <p className="text-white text-2xl font-bold">$125,000</p>
                <p className="text-green-400 text-sm">+12.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Daily Volume</p>
                <p className="text-white text-2xl font-bold">₦2.5M</p>
                <p className="text-blue-400 text-sm">+15.3%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Transactions</p>
                <p className="text-white text-2xl font-bold">23</p>
                <p className="text-purple-400 text-sm">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Alerts</p>
                <p className="text-white text-2xl font-bold">{unacknowledgedCount}</p>
                <p className="text-orange-400 text-sm">Unacknowledged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Token Balances */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Treasury Balances</h2>
            <p className="text-slate-400">Real-time balance monitoring with ON/OFF-RAMP breakdown</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleRefreshAll}
              disabled={refreshing}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
            <Button
              onClick={handleTriggerMonitoring}
              disabled={refreshing}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Activity className={`h-4 w-4 mr-2 ${refreshing ? 'animate-pulse' : ''}`} />
              Monitor
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {enhancedBalances.map((balance) => (
            <EnhancedTokenBalanceCard
              key={balance.currency}
              currency={balance.currency}
              balance={balance.balance}
              availableBalance={balance.availableBalance}
              lockedBalance={balance.lockedBalance}
              demandScore={balance.demandScore}
              onRampTotal={balance.onRampTotal}
              offRampTotal={balance.offRampTotal}
              lastUpdated={balance.lastUpdated}
            />
          ))}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TreasuryAnalyticsChart />
        <TokenDistributionChart balances={enhancedBalances} />
      </div>

      {/* Treasury Transactions */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Treasury Transactions</CardTitle>
              <CardDescription className="text-slate-400">
                Recent treasury operations and fund movements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Transaction Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="All Currencies" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="SUI">SUI</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="NAIRA">NAIRA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Table */}
          {transactions.loading ? (
            <div className="text-center py-8 text-slate-400">Loading transactions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-300 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-medium">Description</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-medium">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction: any) => (
                      <tr key={transaction.id} className="border-b border-slate-700 hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-slate-300 border-slate-600">
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${
                            transaction.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                            transaction.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          } border-0`}>
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-white font-semibold">
                          {transaction.amount?.toLocaleString()} {transaction.currency}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {transaction.description || 'No description'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {transaction.createdAt?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-sm">
                          {transaction.transactionHash ? 
                            `${transaction.transactionHash.slice(0, 8)}...` : 
                            'N/A'
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No transactions found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
