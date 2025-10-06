"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseTransactions } from "@/hooks/useFirebaseTransactions";
import { useFirebaseAnalytics } from "@/hooks/useFirebaseAnalytics";
import { useFirebaseContext } from "@/components/providers/firebase-provider";
import { ConnectButton } from "@mysten/dapp-kit";
import { toast } from "sonner";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, description, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend && (
          <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </Badge>
        )}
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
  onUpdateStatus: (id: string, status: string) => void;
}

function TransactionRow({ transaction, onUpdateStatus }: TransactionRowProps) {
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

  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm font-mono">{transaction.txId.slice(0, 8)}...</td>
      <td className="px-4 py-3">
        <Badge className={getTypeColor(transaction.type)}>
          {transaction.type}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge className={getStatusColor(transaction.status)}>
          {transaction.status}
        </Badge>
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

export default function FirebaseAdminDashboard() {
  const { transactions, loading: txLoading, updateTransaction } = useFirebaseTransactions();
  const { analytics, loading: analyticsLoading } = useFirebaseAnalytics();
  const { isConnected, migrationStatus, migrationError, migratedCount } = useFirebaseContext();
  const [selectedTab, setSelectedTab] = useState("overview");

  const handleUpdateTransactionStatus = async (id: string, status: string) => {
    try {
      await updateTransaction(id, { status });
      toast.success(`Transaction ${status.toLowerCase()} successfully`);
    } catch (error) {
      toast.error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        <h1 className="text-3xl font-bold">Firebase Admin Dashboard</h1>
        <p className="text-muted-foreground">Real-time transaction monitoring and management</p>
        
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Total Transactions" 
              value={analytics.totalTransactions}
              description="All time transactions"
            />
            <MetricCard 
              title="Total Volume" 
              value={`₦${analytics.totalVolume.toLocaleString()}`}
              description="Total transaction volume"
            />
            <MetricCard 
              title="Total Revenue" 
              value={`₦${analytics.totalRevenue.toLocaleString()}`}
              description="1% fee from completed transactions"
            />
            <MetricCard 
              title="Pending Transactions" 
              value={analytics.pendingTransactions}
              description="Awaiting confirmation"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard 
              title="ON-RAMP Transactions" 
              value={analytics.onRampTransactions}
              description="Naira to SUI swaps"
            />
            <MetricCard 
              title="OFF-RAMP Transactions" 
              value={analytics.offRampTransactions}
              description="SUI to Naira swaps"
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
                Real-time transaction monitoring and status updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
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
                      {transactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          onUpdateStatus={handleUpdateTransactionStatus}
                        />
                      ))}
                    </tbody>
                  </table>
                  
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard 
              title="Average Transaction Value" 
              value={`₦${analytics.averageTransactionValue.toLocaleString()}`}
              description="Average transaction size"
            />
            <MetricCard 
              title="Completed Rate" 
              value={`${analytics.totalTransactions > 0 ? ((analytics.completedTransactions / analytics.totalTransactions) * 100).toFixed(1) : 0}%`}
              description="Success rate"
            />
            <MetricCard 
              title="Failed Transactions" 
              value={analytics.failedTransactions}
              description="Failed transaction count"
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
                />
                <MetricCard 
                  title="Last 24h Volume" 
                  value={`₦${analytics.last24HoursVolume.toLocaleString()}`}
                  description="Volume in the last 24 hours"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
