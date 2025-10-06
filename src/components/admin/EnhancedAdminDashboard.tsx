"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebaseTransactions } from "@/hooks/useFirebaseTransactions";
import { useFirebaseAnalytics } from "@/hooks/useFirebaseAnalytics";
import { useFirebaseContext } from "@/components/providers/firebase-provider";
import { useFirebaseSystemHealth } from "@/hooks/useFirebaseCollections";
import TreasuryManagement from "@/components/admin/TreasuryManagement";
import { ConnectButton } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckSquare, 
  Square,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  Server,
  Wifi,
  Database,
  Wallet
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

function MetricCard({ title, value, description, trend, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {icon}
          {trend && (
            <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface TransactionRowProps {
  transaction: any;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

function TransactionRow({ transaction, isSelected, onSelect, onUpdateStatus }: TransactionRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'ON_RAMP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={(checked) => onSelect(transaction.id, checked as boolean)}
        />
      </td>
      <td className="px-4 py-3 text-sm font-mono">{transaction.txId.slice(0, 8)}...</td>
      <td className="px-4 py-3">
        <Badge className={getTypeColor(transaction.type)}>
          {transaction.type}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(transaction.status)}
          <Badge className={getStatusColor(transaction.status)}>
            {transaction.status}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-mono">{transaction.userAddress.slice(0, 8)}...</td>
      <td className="px-4 py-3 text-sm">{transaction.suiAmount} SUI</td>
      <td className="px-4 py-3 text-sm">₦{transaction.nairaAmount.toLocaleString()}</td>
      <td className="px-4 py-3 text-sm">{transaction.exchangeRate}</td>
      <td className="px-4 py-3 text-sm">{new Date(transaction.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3">
        <div className="flex space-x-2">
          {transaction.status === 'PENDING' && (
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(transaction.id, 'CONFIRMED')}
            >
              Confirm
            </Button>
          )}
          {transaction.status === 'CONFIRMED' && (
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(transaction.id, 'COMPLETED')}
            >
              Complete
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function EnhancedAdminDashboard() {
  const { transactions, loading: txLoading, updateTransaction } = useFirebaseTransactions();
  const { analytics, loading: analyticsLoading } = useFirebaseAnalytics();
  const { isConnected, migrationStatus, migrationError, migratedCount } = useFirebaseContext();
  const { systemHealth, loading: healthLoading, getOverallSystemStatus } = useFirebaseSystemHealth();
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState("overview");

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.txId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.userAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(tx => new Date(tx.createdAt) >= filterDate);
    }

    return filtered;
  }, [transactions, searchTerm, statusFilter, typeFilter, dateRange]);

  // Handle transaction selection
  const handleSelectTransaction = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransactions(newSelected);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTransactions(new Set(filteredTransactions.map(tx => tx.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedTransactions.size === 0) {
      toast.error("Please select transactions to update");
      return;
    }

    try {
      const promises = Array.from(selectedTransactions).map(id => 
        updateTransaction(id, { status })
      );
      await Promise.all(promises);
      toast.success(`Updated ${selectedTransactions.size} transactions to ${status}`);
      setSelectedTransactions(new Set());
    } catch (error) {
      toast.error(`Failed to update transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle individual status update
  const handleUpdateTransactionStatus = async (id: string, status: string) => {
    try {
      await updateTransaction(id, { status });
      toast.success(`Transaction ${status.toLowerCase()} successfully`);
    } catch (error) {
      toast.error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Export functionality
  const handleExport = (format: 'csv' | 'json') => {
    const dataToExport = filteredTransactions.map(tx => ({
      'Transaction ID': tx.txId,
      'Type': tx.type,
      'Status': tx.status,
      'User Address': tx.userAddress,
      'SUI Amount': tx.suiAmount,
      'Naira Amount': tx.nairaAmount,
      'Exchange Rate': tx.exchangeRate,
      'Created At': new Date(tx.createdAt).toISOString(),
      'Payment Reference': tx.paymentReference || '',
      'Bank Account': tx.bankAccount || '',
      'Bank Name': tx.bankName || ''
    }));

    if (format === 'csv') {
      const csvContent = [
        Object.keys(dataToExport[0] || {}).join(','),
        ...dataToExport.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`Exported ${dataToExport.length} transactions as ${format.toUpperCase()}`);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Connection Error</CardTitle>
            <CardDescription>
              Unable to connect to Firebase. Please check your configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Firebase is not connected. Please verify your environment variables.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Enhanced Admin Dashboard</h1>
        <p className="text-muted-foreground">Real-time transaction monitoring and management with advanced features</p>
        
        {/* Migration Status */}
        {migrationStatus === 'migrating' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">🔄 Migrating data from local storage to Firebase...</p>
          </div>
        )}
        
        {migrationStatus === 'completed' && migratedCount > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✅ Successfully migrated {migratedCount} transactions to Firebase</p>
          </div>
        )}
        
        {migrationStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ Migration error: {migrationError}</p>
          </div>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="treasury">Treasury</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Total Transactions" 
              value={analytics.totalTransactions}
              description="All time transactions"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard 
              title="Total Volume" 
              value={`₦${analytics.totalVolume.toLocaleString()}`}
              description="Total transaction volume"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <MetricCard 
              title="Total Revenue" 
              value={`₦${analytics.totalRevenue.toLocaleString()}`}
              description="1% fee from completed transactions"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <MetricCard 
              title="Pending Transactions" 
              value={analytics.pendingTransactions}
              description="Awaiting confirmation"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard 
              title="ON-RAMP Transactions" 
              value={analytics.onRampTransactions}
              description="Naira to SUI swaps"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard 
              title="OFF-RAMP Transactions" 
              value={analytics.offRampTransactions}
              description="SUI to Naira swaps"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Firebase connection and data status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Firebase Connection</span>
                  <Badge variant={isConnected ? 'default' : 'destructive'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Migration</span>
                  <Badge variant={migrationStatus === 'completed' ? 'default' : 'secondary'}>
                    {migrationStatus === 'completed' ? 'Completed' : migrationStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Real-time Updates</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Management</CardTitle>
              <CardDescription>
                Advanced transaction monitoring with filtering, search, and bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="ON_RAMP">ON-RAMP</SelectItem>
                      <SelectItem value="OFF_RAMP">OFF-RAMP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date-filter">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('json')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bulk Operations */}
              {selectedTransactions.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">
                      {selectedTransactions.size} transaction(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleBulkStatusUpdate('CONFIRMED')}
                      >
                        Confirm Selected
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleBulkStatusUpdate('COMPLETED')}
                      >
                        Complete Selected
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleBulkStatusUpdate('FAILED')}
                      >
                        Mark Failed
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Table */}
              {txLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-4 py-3">
                          <Checkbox 
                            checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="text-left px-4 py-3">Transaction ID</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-left px-4 py-3">SUI Amount</th>
                        <th className="text-left px-4 py-3">Naira Amount</th>
                        <th className="text-left px-4 py-3">Rate</th>
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="text-left px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          isSelected={selectedTransactions.has(transaction.id)}
                          onSelect={handleSelectTransaction}
                          onUpdateStatus={handleUpdateTransactionStatus}
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
        </TabsContent>

        <TabsContent value="treasury" className="space-y-6">
          <TreasuryManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard 
              title="Average Transaction Value" 
              value={`₦${analytics.averageTransactionValue.toLocaleString()}`}
              description="Average transaction size"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <MetricCard 
              title="Completed Rate" 
              value={`${analytics.totalTransactions > 0 ? ((analytics.completedTransactions / analytics.totalTransactions) * 100).toFixed(1) : 0}%`}
              description="Success rate"
              icon={<CheckCircle className="h-4 w-4" />}
            />
            <MetricCard 
              title="Failed Transactions" 
              value={analytics.failedTransactions}
              description="Failed transaction count"
              icon={<XCircle className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>24-Hour Activity</CardTitle>
              <CardDescription>Recent transaction activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricCard 
                  title="Last 24h Transactions" 
                  value={analytics.last24HoursTransactions}
                  description="Transactions in the last 24 hours"
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <MetricCard 
                  title="Last 24h Volume" 
                  value={`₦${analytics.last24HoursVolume.toLocaleString()}`}
                  description="Volume in the last 24 hours"
                  icon={<DollarSign className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health Monitoring</CardTitle>
              <CardDescription>Real-time system status and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      getOverallSystemStatus() === 'HEALTHY' ? 'bg-green-500' : 
                      getOverallSystemStatus() === 'DEGRADED' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">Firebase</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                  <p className="text-xs text-green-600">Response: &lt;100ms</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Paystack API</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Operational</p>
                  <p className="text-xs text-green-600">Response: &lt;200ms</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">CoinGecko API</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Degraded</p>
                  <p className="text-xs text-yellow-600">Response: &gt;5s</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Sui Network</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Operational</p>
                  <p className="text-xs text-green-600">Response: &lt;500ms</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/health');
                      const data = await response.json();
                      toast.success('Health check completed');
                      console.log('Health check results:', data);
                    } catch (error) {
                      toast.error('Health check failed');
                    }
                  }}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Health Check
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Health Checks</CardTitle>
              <CardDescription>Latest system health monitoring results</CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="text-center py-8">Loading health data...</div>
              ) : (
                <div className="space-y-4">
                  {systemHealth.slice(0, 10).map((health, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          health.status === 'HEALTHY' ? 'bg-green-500' : 
                          health.status === 'DEGRADED' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{health.serviceName}</p>
                          <p className="text-sm text-muted-foreground">
                            {health.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          health.status === 'HEALTHY' ? 'default' : 
                          health.status === 'DEGRADED' ? 'secondary' : 'destructive'
                        }>
                          {health.status}
                        </Badge>
                        {health.responseTime && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {health.responseTime}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {systemHealth.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No health check data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
