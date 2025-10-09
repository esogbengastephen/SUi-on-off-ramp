"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseTransactions } from "@/hooks/useFirebaseTransactions";
import { useBulkOperations } from "@/hooks/useFirebaseAdmin";
import { useCurrentWallet } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { 
  Search, 
  Filter, 
  Download, 
  Upload,
  CheckSquare,
  Square,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  Hash,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Settings,
  FileText,
  Zap,
  Target,
  TrendingUp,
  Activity
} from "lucide-react";

// Enhanced Transaction Card Component
interface TransactionCardProps {
  transaction: any;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onViewDetails: (transaction: any) => void;
}

function TransactionCard({ transaction, isSelected, onSelect, onApprove, onReject, onViewDetails }: TransactionCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'awaiting_admin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'ON_RAMP' ? 
      <ArrowDownLeft className="h-4 w-4 text-green-400" /> : 
      <ArrowUpRight className="h-4 w-4 text-blue-400" />;
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    onReject(transaction.id, rejectReason);
    setShowRejectDialog(false);
    setRejectReason("");
  };

  return (
    <>
      <Card className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 ${
        isSelected ? 'ring-2 ring-blue-500/50' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(transaction.id, !!checked)}
                className="border-slate-600 data-[state=checked]:bg-blue-600"
              />
              <div className="flex items-center space-x-2">
                {getTypeIcon(transaction.type)}
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {transaction.type.replace('_', '-')}
                  </h3>
                  <p className="text-slate-400 text-xs font-mono">
                    {transaction.id?.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status}
              </Badge>
              {transaction.requiresAdminApproval && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Needs Approval
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <p className="text-slate-400 text-xs">Amount</p>
                <p className="text-white font-semibold">
                  {transaction.type === 'ON_RAMP' ? '₦' : ''}{transaction.amount?.toLocaleString()}
                  {transaction.type === 'OFF_RAMP' ? ` ${transaction.token}` : ''}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">User</p>
                <p className="text-slate-300 font-mono text-xs">
                  {transaction.userWalletAddress?.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-slate-400 text-xs">Created</p>
                <p className="text-slate-300 text-xs">
                  {transaction.createdAt?.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Updated</p>
                <p className="text-slate-300 text-xs">
                  {transaction.updatedAt?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          {transaction.riskScore && transaction.riskScore > 70 && (
            <div className="flex items-center space-x-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-sm">High Risk Transaction</span>
              <Badge className="bg-red-500/20 text-red-400">
                Risk: {transaction.riskScore}%
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(transaction)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
            
            {transaction.status === 'awaiting_admin' && (
              <>
                <Button
                  size="sm"
                  onClick={() => onApprove(transaction.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <X className="h-5 w-5 text-red-400" />
                <span>Reject Transaction</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Provide a reason for rejecting this transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rejectReason" className="text-slate-300">Reason</Label>
                <Input
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Insufficient documentation, Suspicious activity"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  className="flex-1"
                >
                  Reject Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Bulk Operations Component
function BulkOperations({ selectedTransactions, onBulkAction }: { 
  selectedTransactions: string[], 
  onBulkAction: (action: string, data?: any) => void 
}) {
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkReason, setBulkReason] = useState("");

  const handleBulkAction = () => {
    if (bulkAction === 'reject' && !bulkReason.trim()) {
      toast.error('Please provide a reason for bulk rejection');
      return;
    }
    
    onBulkAction(bulkAction, bulkAction === 'reject' ? { reason: bulkReason } : undefined);
    setShowBulkDialog(false);
    setBulkAction("");
    setBulkReason("");
  };

  if (selectedTransactions.length === 0) return null;

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckSquare className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">
                {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => {
                  setBulkAction('approve');
                  setShowBulkDialog(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Bulk Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setBulkAction('reject');
                  setShowBulkDialog(true);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Bulk Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction('export')}
                className="border-slate-600 text-slate-300"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">
                Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Transactions
              </CardTitle>
              <CardDescription className="text-slate-400">
                This action will affect {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bulkAction === 'reject' && (
                <div>
                  <Label className="text-slate-300">Reason for Rejection</Label>
                  <Input
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder="Enter reason for bulk rejection"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              )}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDialog(false)}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkAction}
                  className={`flex-1 ${
                    bulkAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {bulkAction === 'approve' ? 'Approve All' : 'Reject All'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Advanced Filters Component
function AdvancedFilters({ filters, onFiltersChange }: {
  filters: any,
  onFiltersChange: (filters: any) => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Filters & Search</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="border-slate-600 text-slate-300"
          >
            <Filter className="h-4 w-4 mr-1" />
            {showAdvanced ? 'Simple' : 'Advanced'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search transactions..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <Select value={filters.status || 'all'} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="awaiting_admin">Awaiting Admin</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.type || 'all'} onValueChange={(value) => onFiltersChange({ ...filters, type: value })}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ON_RAMP">ON-RAMP</SelectItem>
              <SelectItem value="OFF_RAMP">OFF-RAMP</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.timeRange || '7d'} onValueChange={(value) => onFiltersChange({ ...filters, timeRange: value })}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="1d">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
            <div>
              <Label className="text-slate-300">Amount Range (₦)</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount || ''}
                  onChange={(e) => onFiltersChange({ ...filters, minAmount: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount || ''}
                  onChange={(e) => onFiltersChange({ ...filters, maxAmount: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-slate-300">User Wallet</Label>
              <Input
                placeholder="0x..."
                value={filters.userWallet || ''}
                onChange={(e) => onFiltersChange({ ...filters, userWallet: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white font-mono"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Transaction Hash</Label>
              <Input
                placeholder="Transaction hash..."
                value={filters.txHash || ''}
                onChange={(e) => onFiltersChange({ ...filters, txHash: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white font-mono"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Transaction Statistics Component
function TransactionStatistics({ transactions }: { transactions: any[] }) {
  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    awaitingAdmin: transactions.filter(t => t.status === 'awaiting_admin').length,
    totalVolume: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    onRampCount: transactions.filter(t => t.type === 'ON_RAMP').length,
    offRampCount: transactions.filter(t => t.type === 'OFF_RAMP').length
  };

  const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <Activity className="h-6 w-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-slate-400 text-xs">Total</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <CheckSquare className="h-6 w-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          <p className="text-slate-400 text-xs">Completed</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <Clock className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="text-slate-400 text-xs">Pending</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <X className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          <p className="text-slate-400 text-xs">Failed</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-400">{stats.awaitingAdmin}</p>
          <p className="text-slate-400 text-xs">Awaiting</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-400">{successRate}%</p>
          <p className="text-slate-400 text-xs">Success Rate</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <ArrowDownLeft className="h-6 w-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-400">{stats.onRampCount}</p>
          <p className="text-slate-400 text-xs">ON-RAMP</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <ArrowUpRight className="h-6 w-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-400">{stats.offRampCount}</p>
          <p className="text-slate-400 text-xs">OFF-RAMP</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Advanced Transaction Management Component
export default function AdvancedTransactionManagement() {
  const { currentWallet } = useCurrentWallet();
  const { transactions, loading, updateTransaction } = useFirebaseTransactions();
  const { createBulkOperation } = useBulkOperations();
  
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    timeRange: '7d'
  });
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  // Filter transactions from real Firebase data
  const filteredTransactions = (transactions || []).filter(transaction => {
    const searchMatch = filters.search === "" || 
      transaction.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.userWalletAddress.toLowerCase().includes(filters.search.toLowerCase());
    
    const statusMatch = filters.status === "all" || transaction.status === filters.status;
    const typeMatch = filters.type === "all" || transaction.type === filters.type;
    
    return searchMatch && statusMatch && typeMatch;
  });

  const handleSelectTransaction = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedTransactions(prev => [...prev, id]);
    } else {
      setSelectedTransactions(prev => prev.filter(txId => txId !== id));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTransactions(filteredTransactions.map(tx => tx.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleApproveTransaction = async (id: string) => {
    try {
      await updateTransaction(id, { 
        status: 'completed',
        approvedBy: currentWallet?.accounts?.[0]?.address,
        approvedAt: new Date()
      });
      toast.success('Transaction approved successfully');
    } catch (error) {
      toast.error('Failed to approve transaction');
    }
  };

  const handleRejectTransaction = async (id: string, reason: string) => {
    try {
      await updateTransaction(id, { 
        status: 'failed',
        rejectedBy: currentWallet?.accounts?.[0]?.address,
        rejectedAt: new Date(),
        rejectionReason: reason
      });
      toast.success('Transaction rejected successfully');
    } catch (error) {
      toast.error('Failed to reject transaction');
    }
  };

  const handleBulkAction = async (action: string, data?: any) => {
    try {
      await createBulkOperation({
        action,
        transactionIds: selectedTransactions,
        executedBy: currentWallet?.accounts?.[0]?.address || '',
        data
      });
      
      setSelectedTransactions([]);
      toast.success(`Bulk ${action} completed successfully`);
    } catch (error) {
      toast.error(`Failed to execute bulk ${action}`);
    }
  };

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  return (
    <div className="space-y-8">
      {/* Transaction Management Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Transaction Management</h2>
          <p className="text-slate-400">Manage, approve, and monitor all transactions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Transaction Statistics */}
      <TransactionStatistics transactions={filteredTransactions} />

      {/* Advanced Filters */}
      <AdvancedFilters filters={filters} onFiltersChange={setFilters} />

      {/* Bulk Operations */}
      <BulkOperations 
        selectedTransactions={selectedTransactions} 
        onBulkAction={handleBulkAction} 
      />

      {/* Select All */}
      {filteredTransactions.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectedTransactions.length === filteredTransactions.length}
                onCheckedChange={handleSelectAll}
                className="border-slate-600 data-[state=checked]:bg-blue-600"
              />
              <span className="text-slate-300">
                Select all {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Grid */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading transactions...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedTransactions.includes(transaction.id)}
              onSelect={handleSelectTransaction}
              onApprove={handleApproveTransaction}
              onReject={handleRejectTransaction}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {filteredTransactions.length === 0 && !loading && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No Transactions Found</h3>
            <p className="text-slate-400">No transactions match your current filters</p>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Transaction Details</CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowTransactionDetails(false)}
                  className="text-slate-400"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Transaction ID</Label>
                    <p className="text-white font-mono">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Type</Label>
                    <p className="text-white">{selectedTransaction.type}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Status</Label>
                    <Badge className={getStatusColor(selectedTransaction.status)}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-slate-400">Amount</Label>
                    <p className="text-white">
                      {selectedTransaction.type === 'ON_RAMP' ? '₦' : ''}{selectedTransaction.amount?.toLocaleString()}
                      {selectedTransaction.type === 'OFF_RAMP' ? ` ${selectedTransaction.token}` : ''}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-400">User Wallet Address</Label>
                  <p className="text-white font-mono break-all">{selectedTransaction.userWalletAddress}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Created At</Label>
                    <p className="text-white">{selectedTransaction.createdAt?.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Updated At</Label>
                    <p className="text-white">{selectedTransaction.updatedAt?.toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedTransaction.riskScore && (
                  <div>
                    <Label className="text-slate-400">Risk Score</Label>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            selectedTransaction.riskScore >= 80 ? 'bg-red-400' :
                            selectedTransaction.riskScore >= 60 ? 'bg-orange-400' :
                            selectedTransaction.riskScore >= 40 ? 'bg-yellow-400' :
                            'bg-green-400'
                          }`}
                          style={{ width: `${selectedTransaction.riskScore}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold">{selectedTransaction.riskScore}%</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'awaiting_admin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }
}
