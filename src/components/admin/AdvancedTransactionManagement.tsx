"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealDashboardData } from "@/hooks/useRealDashboardData";
import { useTransactionList, Transaction } from "@/hooks/useTransactionList";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  DollarSign,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function AdvancedTransactionManagement() {
  const { transactionData, refresh: refreshRealData } = useRealDashboardData();
  const { data: transactionListData, loading: transactionListLoading, refreshTransactionList } = useTransactionList();
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshRealData(),
        refreshTransactionList(currentPage, 10, searchTerm, filterStatus, filterType)
      ]);
      toast.success('Transaction data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh transaction data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refreshTransactionList(1, 10, searchTerm, filterStatus, filterType);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    refreshTransactionList(1, 10, searchTerm, filterStatus, filterType);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    refreshTransactionList(page, 10, searchTerm, filterStatus, filterType);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      case 'cancelled': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'on_ramp': return <ArrowDownLeft className="h-4 w-4 text-green-400" />;
      case 'off_ramp': return <ArrowUpRight className="h-4 w-4 text-blue-400" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Transaction Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Transactions</p>
                  <p className="text-white text-2xl font-bold">{transactionData.totalTransactions}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Pending</p>
                  <p className="text-white text-2xl font-bold">{transactionData.pendingTransactions}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Completed</p>
                  <p className="text-white text-2xl font-bold">{transactionData.completedTransactions}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Failed</p>
                  <p className="text-white text-2xl font-bold">{transactionData.failedTransactions}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transaction Search and Filters */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Transaction Search</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Search and filter transactions by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Search by transaction ID, user address, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); handleFilterChange(); }}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(value) => { setFilterType(value); handleFilterChange(); }}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="on_ramp">On-Ramp</SelectItem>
                  <SelectItem value="off_ramp">Off-Ramp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSearch}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Statistics */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Transaction Statistics</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Real-time transaction metrics and success rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Success Rate</span>
                <Badge className="bg-green-500 text-white">
                  {transactionData.totalTransactions > 0 ? 
                    ((transactionData.completedTransactions / transactionData.totalTransactions) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Failure Rate</span>
                <Badge className="bg-red-500 text-white">
                  {transactionData.totalTransactions > 0 ? 
                    ((transactionData.failedTransactions / transactionData.totalTransactions) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Pending Rate</span>
                <Badge className="bg-yellow-500 text-white">
                  {transactionData.totalTransactions > 0 ? 
                    ((transactionData.pendingTransactions / transactionData.totalTransactions) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Daily Volume</span>
                <span className="text-green-400 font-semibold">
                  ₦{(transactionData.dailyVolume / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Last Updated</span>
                <span className="text-slate-400 text-sm">
                  {transactionData.lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Transaction List</span>
            {transactionListData && (
              <Badge variant="outline" className="text-slate-300 border-slate-600">
                {transactionListData.pagination.totalTransactions} Total
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Real-time transaction data with search and filtering capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionListLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 text-slate-400 mx-auto mb-4 animate-spin" />
              <p className="text-slate-400">Loading transactions...</p>
            </div>
          ) : transactionListData && transactionListData.transactions.length > 0 ? (
            <div className="space-y-4">
              {/* Transaction Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Rate</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionListData.transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(transaction.type)}
                            <span className="text-white font-medium capitalize">
                              {transaction.type.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getStatusColor(transaction.status)} border-0`}>
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-mono text-sm">
                            {transaction.userAddress.slice(0, 8)}...{transaction.userAddress.slice(-6)}
                          </div>
                          {transaction.email && (
                            <div className="text-slate-400 text-xs">{transaction.email}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-semibold">
                            {transaction.suiAmount} SUI
                          </div>
                          <div className="text-slate-400 text-sm">
                            ₦{transaction.nairaAmount.toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-300 text-sm">
                            ₦{transaction.exchangeRate.toLocaleString()}/SUI
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-400 text-sm">
                            {transaction.createdAt.toLocaleDateString()}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {transaction.createdAt.toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {transactionListData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-slate-400 text-sm">
                    Showing {((transactionListData.pagination.currentPage - 1) * transactionListData.pagination.limit) + 1} to{' '}
                    {Math.min(transactionListData.pagination.currentPage * transactionListData.pagination.limit, transactionListData.pagination.totalTransactions)} of{' '}
                    {transactionListData.pagination.totalTransactions} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!transactionListData.pagination.hasPrevPage}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-slate-300 text-sm px-2">
                      Page {transactionListData.pagination.currentPage} of {transactionListData.pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!transactionListData.pagination.hasNextPage}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No transactions found</p>
              <p className="text-slate-500 text-sm">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                  ? 'Try adjusting your search criteria or filters'
                  : 'Transactions will appear here once users start making swaps'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}