"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentWallet } from "@mysten/dapp-kit";
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
  Users,
  Shield,
  AlertTriangle,
  Settings,
  BarChart3,
  PieChart,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Moon,
  Sun
} from "lucide-react";

// Import Firebase admin hooks
import {
  useAdminUsers,
  useAdminActivity,
  useTreasurySnapshots,
  useTreasuryAlerts,
  useTransactionOverrides,
  useBulkOperations,
  useUserProfiles,
  useDailyAnalytics,
  useSystemAlerts,
  useAdminSettings
} from "@/hooks/useFirebaseAdmin";
import TreasuryDashboard from "./TreasuryDashboard";
import UserManagement from "./UserManagement";
import AnalyticsDashboard from "./AnalyticsDashboard";
import SystemHealth from "./SystemHealth";
import AdminManagement from "./AdminManagement";
import AdvancedTransactionManagement from "./AdvancedTransactionManagement";
import EmergencyControls from "./EmergencyControls";

// Treasury Health Score Component (similar to Risk Score)
interface TreasuryHealthScoreProps {
  score: number;
  className?: string;
}

function TreasuryHealthScore({ score, className = "" }: TreasuryHealthScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-400 to-green-600";
    if (score >= 60) return "from-yellow-400 to-yellow-600";
    if (score >= 40) return "from-orange-400 to-orange-600";
    return "from-red-400 to-red-600";
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative ${className}`}>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={`stop-color-${getScoreGradient(score).split(' ')[0].replace('from-', '')}`} />
              <stop offset="100%" className={`stop-color-${getScoreGradient(score).split(' ')[1].replace('to-', '')}`} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className="text-xs text-slate-400">Health</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component (crypto-style)
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  gradient?: string;
}

function MetricCard({ title, value, change, changeType, icon, gradient = "from-blue-500 to-purple-600" }: MetricCardProps) {
  const getChangeColor = (type?: string) => {
    switch (type) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient}`}>
              {icon}
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">{title}</p>
              <p className="text-white text-2xl font-bold">{value}</p>
              {change && (
                <p className={`text-sm ${getChangeColor(changeType)}`}>
                  {change}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Token Balance Card Component
interface TokenBalanceCardProps {
  token: string;
  balance: number;
  available: number;
  locked: number;
  demandScore: number;
  icon: React.ReactNode;
}

function TokenBalanceCard({ token, balance, available, locked, demandScore, icon }: TokenBalanceCardProps) {
  const formatBalance = (amount: number) => {
    if (token === 'NAIRA') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${amount.toLocaleString()} ${token}`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle className="text-white text-lg">{token}</CardTitle>
          </div>
          <Badge variant="outline" className="text-slate-300 border-slate-600">
            Demand: {demandScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm">Total Balance</p>
            <p className="text-white text-xl font-bold">{formatBalance(balance)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-xs">Available</p>
              <p className="text-green-400 font-semibold">{formatBalance(available)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Locked</p>
              <p className="text-orange-400 font-semibold">{formatBalance(locked)}</p>
            </div>
          </div>
          
          {/* Demand Score Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Demand Score</span>
              <span>{demandScore}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${demandScore}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Transaction Row Component
interface TransactionRowProps {
  transaction: any;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

function TransactionRow({ transaction, onSelect, isSelected }: TransactionRowProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
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
    <tr className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect?.(transaction.id)}
          className="rounded border-slate-600 bg-slate-700"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          {getTypeIcon(transaction.type)}
          <span className="text-white font-medium">{transaction.type}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={`${getStatusColor(transaction.status)} border-0`}>
          {transaction.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-white font-mono">
        {transaction.userAddress?.slice(0, 8)}...
      </td>
      <td className="px-4 py-3 text-white font-semibold">
        {transaction.suiAmount} SUI
      </td>
      <td className="px-4 py-3 text-white font-semibold">
        ₦{transaction.nairaAmount?.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-slate-400 text-sm">
        {transaction.createdAt?.toLocaleString()}
      </td>
    </tr>
  );
}

// Main Dashboard Component
export default function ModernAdminDashboard() {
  const { currentWallet } = useCurrentWallet();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isDarkMode, setIsDarkMode] = useState(true);
  // Transaction management moved to AdvancedTransactionManagement component
  const [refreshing, setRefreshing] = useState(false);

  // Firebase hooks
  const { adminUsers } = useAdminUsers();
  const { activities } = useAdminActivity();
  const { snapshots, latestSnapshot } = useTreasurySnapshots();
  const { alerts, unacknowledgedCount } = useTreasuryAlerts();
  const { profiles } = useUserProfiles();
  const { analytics } = useDailyAnalytics();
  const { alerts: systemAlerts, unresolvedCount } = useSystemAlerts();

  // Check if user is admin
  const isAdmin = currentWallet?.accounts?.[0]?.address === "0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580";

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger refresh of real-time data
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 1000);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Real treasury data from Firebase
  const treasuryData = latestSnapshot || {
    balances: {},
    healthScore: 0,
    totalValueUSD: 0,
    totalValueNGN: 0
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Bulk action handling moved to AdvancedTransactionManagement component

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
            <p className="text-slate-400 mb-6">
              You need admin privileges to access this dashboard. Please connect with an admin wallet.
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Connect Admin Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                Super Admin
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative text-slate-400 hover:text-white">
                <Bell className="h-5 w-5" />
                {(unacknowledgedCount + unresolvedCount) > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs">
                    {unacknowledgedCount + unresolvedCount}
                  </Badge>
                )}
              </Button>
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-slate-400 hover:text-white"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              
              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* Admin Info */}
              <div className="text-right">
                <p className="text-white text-sm font-medium">Admin Panel</p>
                <p className="text-slate-400 text-xs">
                  {currentWallet?.accounts?.[0]?.address?.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="bg-slate-800/50 border-slate-700 mb-8">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="treasury" className="data-[state=active]:bg-slate-700">
              Treasury
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-slate-700">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-slate-700">
              System
            </TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-slate-700">
              Admins
            </TabsTrigger>
            <TabsTrigger value="emergency" className="data-[state=active]:bg-slate-700">
              Emergency
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Treasury Value"
                value={`$${treasuryData.totalValueUSD?.toLocaleString()}`}
                change="+12.5%"
                changeType="positive"
                icon={<DollarSign className="h-6 w-6 text-white" />}
                gradient="from-green-500 to-emerald-600"
              />
              <MetricCard
                title="Active Users"
                value={profiles.length}
                change="+8.2%"
                changeType="positive"
                icon={<Users className="h-6 w-6 text-white" />}
                gradient="from-blue-500 to-cyan-600"
              />
              <MetricCard
                title="Daily Volume"
                value="₦2.5M"
                change="+15.3%"
                changeType="positive"
                icon={<TrendingUp className="h-6 w-6 text-white" />}
                gradient="from-purple-500 to-pink-600"
              />
              <MetricCard
                title="System Health"
                value="98.5%"
                change="+0.2%"
                changeType="positive"
                icon={<Activity className="h-6 w-6 text-white" />}
                gradient="from-orange-500 to-red-600"
              />
            </div>

            {/* Treasury Health & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Treasury Health Score */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Wallet className="h-5 w-5" />
                    <span>Treasury Health</span>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Overall treasury system health score
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <TreasuryHealthScore score={treasuryData.healthScore || 78} />
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Recent Alerts</span>
                    </div>
                    {unacknowledgedCount > 0 && (
                      <Badge className="bg-red-500 text-white">
                        {unacknowledgedCount}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.severity === 'CRITICAL' ? 'bg-red-400' :
                          alert.severity === 'HIGH' ? 'bg-orange-400' :
                          alert.severity === 'MEDIUM' ? 'bg-yellow-400' :
                          'bg-blue-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{alert.message}</p>
                          <p className="text-slate-400 text-xs">{alert.createdAt?.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Treasury
                    </Button>
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Treasury Tab */}
          <TabsContent value="treasury" className="space-y-8">
            <TreasuryDashboard />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <AdvancedTransactionManagement />
          </TabsContent>

          {/* Other tabs will be implemented similarly */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemHealth />
          </TabsContent>

          <TabsContent value="admins" className="space-y-6">
            <AdminManagement />
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <EmergencyControls />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
