"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfiles } from "@/hooks/useFirebaseAdmin";
import { useCurrentWallet } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  AlertTriangle,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Mail,
  Phone,
  Wallet,
  CreditCard
} from "lucide-react";

// User Profile Card Component
interface UserProfileCardProps {
  user: any;
  onBlock: (userId: string, reason: string) => void;
  onUnblock: (userId: string) => void;
  onUpdateLimits: (userId: string, limits: any) => void;
  onViewDetails: (userId: string) => void;
}

function UserProfileCard({ user, onBlock, onUnblock, onUpdateLimits, onViewDetails }: UserProfileCardProps) {
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showLimitsDialog, setShowLimitsDialog] = useState(false);
  const [limits, setLimits] = useState(user.transactionLimits || {});

  const getKycStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expired': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const handleBlock = () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason for blocking');
      return;
    }
    onBlock(user.id, blockReason);
    setShowBlockDialog(false);
    setBlockReason("");
  };

  const handleUpdateLimits = () => {
    onUpdateLimits(user.id, limits);
    setShowLimitsDialog(false);
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {user.walletAddress?.slice(0, 8)}...{user.walletAddress?.slice(-6)}
                </h3>
                <p className="text-slate-400 text-sm">
                  {user.email || 'No email provided'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getKycStatusColor(user.kycStatus)}>
                {user.kycStatus || 'Unknown'}
              </Badge>
              {user.isBlocked && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  Blocked
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-400" />
                <p className="text-slate-400 text-xs">Transactions</p>
              </div>
              <p className="text-white font-semibold">{user.totalTransactions || 0}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <p className="text-slate-400 text-xs">Volume</p>
              </div>
              <p className="text-white font-semibold">₦{(user.totalVolume || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Risk Score */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Risk Score</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    user.riskScore >= 80 ? 'bg-red-400' :
                    user.riskScore >= 60 ? 'bg-orange-400' :
                    user.riskScore >= 40 ? 'bg-yellow-400' :
                    'bg-green-400'
                  }`}
                  style={{ width: `${user.riskScore || 0}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getRiskScoreColor(user.riskScore || 0)}`}>
                {user.riskScore || 0}%
              </span>
            </div>
          </div>

          {/* Transaction Limits */}
          <div className="space-y-2">
            <p className="text-slate-300 text-sm font-medium">Transaction Limits</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-400">Daily</p>
                <p className="text-slate-300">₦{(user.transactionLimits?.dailyLimit || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Per Transaction</p>
                <p className="text-slate-300">₦{(user.transactionLimits?.perTransactionLimit || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Last Activity */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Last Activity</span>
            <span className="text-slate-300">
              {user.lastActivityAt ? user.lastActivityAt.toLocaleDateString() : 'Never'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(user.id)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLimitsDialog(true)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Edit className="h-4 w-4 mr-1" />
              Limits
            </Button>
            {user.isBlocked ? (
              <Button
                size="sm"
                onClick={() => onUnblock(user.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Unblock
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowBlockDialog(true)}
                className="flex-1"
              >
                <Ban className="h-4 w-4 mr-1" />
                Block
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Block User Dialog */}
      {showBlockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Ban className="h-5 w-5 text-red-400" />
                <span>Block User</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Provide a reason for blocking this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="blockReason" className="text-slate-300">Reason</Label>
                <Input
                  id="blockReason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Suspicious activity, Policy violation"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBlockDialog(false)}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBlock}
                  className="flex-1"
                >
                  Block User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Limits Dialog */}
      {showLimitsDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-400" />
                <span>Update Transaction Limits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Daily Limit (₦)</Label>
                <Input
                  type="number"
                  value={limits.dailyLimit || ''}
                  onChange={(e) => setLimits({...limits, dailyLimit: parseInt(e.target.value) || 0})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Weekly Limit (₦)</Label>
                <Input
                  type="number"
                  value={limits.weeklyLimit || ''}
                  onChange={(e) => setLimits({...limits, weeklyLimit: parseInt(e.target.value) || 0})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Per Transaction Limit (₦)</Label>
                <Input
                  type="number"
                  value={limits.perTransactionLimit || ''}
                  onChange={(e) => setLimits({...limits, perTransactionLimit: parseInt(e.target.value) || 0})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLimitsDialog(false)}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLimits}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Update Limits
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// User Details Modal Component
interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

function UserDetailsModal({ user, isOpen, onClose }: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Details</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose} className="text-slate-400">
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-slate-700/50">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-700/30 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-400">Wallet Address</Label>
                      <p className="text-white font-mono text-sm">{user.walletAddress}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Email</Label>
                      <p className="text-white">{user.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Phone</Label>
                      <p className="text-white">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Referral Code</Label>
                      <p className="text-white">{user.referralCode || 'None'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Referred By</Label>
                      <p className="text-white">{user.referredBy || 'Direct signup'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/30 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-400">KYC Status</Label>
                      <Badge className={`ml-2 ${
                        user.kycStatus === 'VERIFIED' ? 'bg-green-500/20 text-green-400' :
                        user.kycStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {user.kycStatus}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-slate-400">Account Status</Label>
                      <Badge className={`ml-2 ${user.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-slate-400">Risk Score</Label>
                      <p className="text-white">{user.riskScore || 0}%</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Member Since</Label>
                      <p className="text-white">{user.createdAt?.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Last Activity</Label>
                      <p className="text-white">{user.lastActivityAt?.toLocaleDateString() || 'Never'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    Transaction history will be loaded here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kyc">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">KYC Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    KYC documents and verification status will be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">User Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    User activity timeline will be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Main User Management Component
export default function UserManagement() {
  const { currentWallet } = useCurrentWallet();
  const { profiles, loading, updateUserProfile, blockUser, unblockUser } = useUserProfiles();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Filter users from real Firebase data
  const filteredUsers = (profiles || []).filter(user => {
    const searchMatch = searchTerm === "" || 
      user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = statusFilter === "all" || 
      (statusFilter === "active" && !user.isBlocked) ||
      (statusFilter === "blocked" && user.isBlocked);
    
    const kycMatch = kycFilter === "all" || user.kycStatus.toLowerCase() === kycFilter.toLowerCase();
    
    return searchMatch && statusMatch && kycMatch;
  });

  const handleBlockUser = async (userId: string, reason: string) => {
    try {
      await blockUser(userId, reason, currentWallet?.accounts?.[0]?.address || '');
      toast.success('User blocked successfully');
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await unblockUser(userId, currentWallet?.accounts?.[0]?.address || '');
      toast.success('User unblocked successfully');
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const handleUpdateLimits = async (userId: string, limits: any) => {
    try {
      await updateUserProfile(userId, { transactionLimits: limits }, currentWallet?.accounts?.[0]?.address || '');
      toast.success('Transaction limits updated successfully');
    } catch (error) {
      toast.error('Failed to update transaction limits');
    }
  };

  const handleViewDetails = (userId: string) => {
    const user = profiles?.find(u => u.id === userId);
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  return (
    <div className="space-y-8">
      {/* User Management Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-slate-400">Manage user profiles, KYC status, and transaction limits</p>
        </div>
        
          {/* User Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profiles?.length || 0}</p>
              <p className="text-slate-400 text-sm">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{profiles?.filter(u => !u.isBlocked).length || 0}</p>
              <p className="text-slate-400 text-sm">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{profiles?.filter(u => u.isBlocked).length || 0}</p>
              <p className="text-slate-400 text-sm">Blocked</p>
            </div>
          </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by wallet address or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Grid */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading users...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserProfileCard
              key={user.id}
              user={user}
              onBlock={handleBlockUser}
              onUnblock={handleUnblockUser}
              onUpdateLimits={handleUpdateLimits}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No Users Found</h3>
            <p className="text-slate-400">No users match your current filters</p>
          </CardContent>
        </Card>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserDetails}
        onClose={() => {
          setShowUserDetails(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
