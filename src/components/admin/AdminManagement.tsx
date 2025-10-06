"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminUsers, useAdminActivity } from "@/hooks/useFirebaseAdmin";
import { useCurrentWallet } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { 
  Shield, 
  UserPlus, 
  Users, 
  Crown, 
  Eye, 
  Settings, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Wallet,
  Key,
  Lock,
  Unlock
} from "lucide-react";

// Admin Role Configuration
const ADMIN_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full access to all features and settings',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <Crown className="h-4 w-4" />,
    permissions: {
      canViewTransactions: true,
      canApproveTransactions: true,
      canRejectTransactions: true,
      canManageUsers: true,
      canManageTreasury: true,
      canViewAnalytics: true,
      canManageAdmins: true,
      canExportData: true,
      canManageSettings: true
    }
  },
  TRANSACTION_ADMIN: {
    name: 'Transaction Admin',
    description: 'Can view and approve/reject transactions',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Activity className="h-4 w-4" />,
    permissions: {
      canViewTransactions: true,
      canApproveTransactions: true,
      canRejectTransactions: true,
      canManageUsers: false,
      canManageTreasury: false,
      canViewAnalytics: true,
      canManageAdmins: false,
      canExportData: true,
      canManageSettings: false
    }
  },
  VIEWER_ADMIN: {
    name: 'Viewer Admin',
    description: 'Read-only access to monitor activity',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: <Eye className="h-4 w-4" />,
    permissions: {
      canViewTransactions: true,
      canApproveTransactions: false,
      canRejectTransactions: false,
      canManageUsers: false,
      canManageTreasury: false,
      canViewAnalytics: true,
      canManageAdmins: false,
      canExportData: false,
      canManageSettings: false
    }
  }
};

// Admin Card Component
interface AdminCardProps {
  admin: any;
  currentAdminAddress: string;
  onUpdateRole: (adminId: string, newRole: string) => void;
  onDeactivate: (adminId: string) => void;
  onViewActivity: (adminId: string) => void;
}

function AdminCard({ admin, currentAdminAddress, onUpdateRole, onDeactivate, onViewActivity }: AdminCardProps) {
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(admin.role);
  
  const roleConfig = ADMIN_ROLES[admin.role as keyof typeof ADMIN_ROLES];
  const isCurrentAdmin = admin.walletAddress === currentAdminAddress;
  const isSuperAdmin = admin.role === 'SUPER_ADMIN';

  const handleUpdateRole = () => {
    if (selectedRole !== admin.role) {
      onUpdateRole(admin.id, selectedRole);
    }
    setShowRoleDialog(false);
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {roleConfig?.icon || <Shield className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {admin.walletAddress?.slice(0, 8)}...{admin.walletAddress?.slice(-6)}
                  {isCurrentAdmin && <span className="text-blue-400 text-sm ml-2">(You)</span>}
                </h3>
                <p className="text-slate-400 text-sm">
                  {admin.email || 'No email provided'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={roleConfig?.color || 'bg-slate-500/20 text-slate-400'}>
                <div className="flex items-center space-x-1">
                  {roleConfig?.icon}
                  <span>{roleConfig?.name}</span>
                </div>
              </Badge>
              {!admin.isActive && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admin Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <p className="text-slate-400 text-xs">Enrolled</p>
              </div>
              <p className="text-white font-semibold text-sm">
                {admin.enrolledAt?.toLocaleDateString() || 'Unknown'}
              </p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-400" />
                <p className="text-slate-400 text-xs">Last Login</p>
              </div>
              <p className="text-white font-semibold text-sm">
                {admin.lastLoginAt ? admin.lastLoginAt.toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Permissions Preview */}
          <div className="space-y-2">
            <p className="text-slate-300 text-sm font-medium">Permissions</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center space-x-1">
                {roleConfig?.permissions.canViewTransactions ? 
                  <CheckCircle className="h-3 w-3 text-green-400" /> : 
                  <XCircle className="h-3 w-3 text-red-400" />
                }
                <span className="text-slate-400">View Transactions</span>
              </div>
              <div className="flex items-center space-x-1">
                {roleConfig?.permissions.canApproveTransactions ? 
                  <CheckCircle className="h-3 w-3 text-green-400" /> : 
                  <XCircle className="h-3 w-3 text-red-400" />
                }
                <span className="text-slate-400">Approve Transactions</span>
              </div>
              <div className="flex items-center space-x-1">
                {roleConfig?.permissions.canManageUsers ? 
                  <CheckCircle className="h-3 w-3 text-green-400" /> : 
                  <XCircle className="h-3 w-3 text-red-400" />
                }
                <span className="text-slate-400">Manage Users</span>
              </div>
              <div className="flex items-center space-x-1">
                {roleConfig?.permissions.canManageAdmins ? 
                  <CheckCircle className="h-3 w-3 text-green-400" /> : 
                  <XCircle className="h-3 w-3 text-red-400" />
                }
                <span className="text-slate-400">Manage Admins</span>
              </div>
            </div>
          </div>

          {/* Enrolled By */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Enrolled By</span>
            <span className="text-slate-300 font-mono">
              {admin.enrolledBy ? `${admin.enrolledBy.slice(0, 8)}...` : 'System'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewActivity(admin.id)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Activity className="h-4 w-4 mr-1" />
              Activity
            </Button>
            {!isCurrentAdmin && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRoleDialog(true)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Role
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDeactivate(admin.id)}
                  disabled={!admin.isActive}
                  className="flex-1"
                >
                  {admin.isActive ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
                  {admin.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Update Dialog */}
      {showRoleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-400" />
                <span>Update Admin Role</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Change the role and permissions for this admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Object.entries(ADMIN_ROLES).map(([key, role]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          {role.icon}
                          <span>{role.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-slate-400 text-sm mt-1">
                  {ADMIN_ROLES[selectedRole as keyof typeof ADMIN_ROLES]?.description}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRoleDialog(false)}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateRole}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Update Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Enroll New Admin Component
function EnrollNewAdmin({ onEnroll }: { onEnroll: (adminData: any) => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VIEWER_ADMIN");
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    setEnrolling(true);
    try {
      await onEnroll({
        walletAddress: walletAddress.trim(),
        email: email.trim() || undefined,
        role,
        isActive: true
      });
      
      setShowDialog(false);
      setWalletAddress("");
      setEmail("");
      setRole("VIEWER_ADMIN");
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Enroll New Admin
      </Button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                <span>Enroll New Admin</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Add a new admin user to the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Wallet Address *</Label>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="bg-slate-700 border-slate-600 text-white font-mono"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Email (Optional)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-slate-300">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Object.entries(ADMIN_ROLES).map(([key, roleConfig]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          {roleConfig.icon}
                          <span>{roleConfig.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-slate-400 text-sm mt-1">
                  {ADMIN_ROLES[role as keyof typeof ADMIN_ROLES]?.description}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 border-slate-600 text-slate-300"
                  disabled={enrolling}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Admin'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Admin Activity Log Component
function AdminActivityLog({ activities }: { activities: any[] }) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'LOGOUT': return <XCircle className="h-4 w-4 text-slate-400" />;
      case 'APPROVE_TRANSACTION': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'REJECT_TRANSACTION': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'BLOCK_USER': return <Lock className="h-4 w-4 text-red-400" />;
      case 'UNBLOCK_USER': return <Unlock className="h-4 w-4 text-green-400" />;
      case 'ENROLL_ADMIN': return <UserPlus className="h-4 w-4 text-blue-400" />;
      case 'UPDATE_SETTINGS': return <Settings className="h-4 w-4 text-purple-400" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'text-green-400';
      case 'LOGOUT': return 'text-slate-400';
      case 'APPROVE_TRANSACTION': return 'text-green-400';
      case 'REJECT_TRANSACTION': return 'text-red-400';
      case 'BLOCK_USER': return 'text-red-400';
      case 'UNBLOCK_USER': return 'text-green-400';
      case 'ENROLL_ADMIN': return 'text-blue-400';
      case 'UPDATE_SETTINGS': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Admin Activity Log</CardTitle>
        <CardDescription className="text-slate-400">
          Recent admin actions and system interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="p-1 rounded">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">
                        {activity.adminWalletAddress?.slice(0, 8)}...
                      </span>
                      <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
                        {activity.targetType}
                      </Badge>
                    </div>
                    <span className="text-slate-400 text-xs">
                      {activity.timestamp?.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${getActionColor(activity.action)}`}>
                    {activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs">
                      <pre className="text-slate-300 overflow-x-auto">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No admin activity recorded yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Admin Management Component
export default function AdminManagement() {
  const { currentWallet } = useCurrentWallet();
  const { adminUsers, loading, enrollAdmin, updateAdminRole, deactivateAdmin } = useAdminUsers();
  const { activities } = useAdminActivity();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("admins");

  const currentAdminAddress = currentWallet?.accounts?.[0]?.address || '';

  // Filter admins from real Firebase data
  const filteredAdmins = (adminUsers || []).filter(admin => {
    const searchMatch = searchTerm === "" || 
      admin.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const roleMatch = roleFilter === "all" || admin.role === roleFilter;
    const statusMatch = statusFilter === "all" || 
      (statusFilter === "active" && admin.isActive) ||
      (statusFilter === "inactive" && !admin.isActive);
    
    return searchMatch && roleMatch && statusMatch;
  });

  const handleEnrollAdmin = async (adminData: any) => {
    try {
      await enrollAdmin({
        ...adminData,
        enrolledBy: currentAdminAddress,
        permissions: ADMIN_ROLES[adminData.role as keyof typeof ADMIN_ROLES].permissions
      });
      toast.success('Admin enrolled successfully');
    } catch (error) {
      toast.error('Failed to enroll admin');
    }
  };

  const handleUpdateRole = async (adminId: string, newRole: string) => {
    try {
      await updateAdminRole(adminId, newRole as any, currentAdminAddress);
      toast.success('Admin role updated successfully');
    } catch (error) {
      toast.error('Failed to update admin role');
    }
  };

  const handleDeactivateAdmin = async (adminId: string) => {
    try {
      await deactivateAdmin(adminId, currentAdminAddress);
      toast.success('Admin status updated successfully');
    } catch (error) {
      toast.error('Failed to update admin status');
    }
  };

  const handleViewActivity = (adminId: string) => {
    // Filter activities for specific admin
    setSelectedTab("activity");
  };

  return (
    <div className="space-y-8">
      {/* Admin Management Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Management</h2>
          <p className="text-slate-400">Manage admin users, roles, and permissions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Admin Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{adminUsers?.length || 0}</p>
              <p className="text-slate-400 text-sm">Total Admins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{adminUsers?.filter(a => a.isActive).length || 0}</p>
              <p className="text-slate-400 text-sm">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{adminUsers?.filter(a => a.role === 'SUPER_ADMIN').length || 0}</p>
              <p className="text-slate-400 text-sm">Super Admins</p>
            </div>
          </div>
          
          <EnrollNewAdmin onEnroll={handleEnrollAdmin} />
        </div>
      </div>

      {/* Admin Management Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-800/50 border-slate-700">
          <TabsTrigger value="admins" className="data-[state=active]:bg-slate-700">
            Admin Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700">
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-slate-700">
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-6">
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
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.entries(ADMIN_ROLES).map(([key, role]) => (
                      <SelectItem key={key} value={key}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Admin Grid */}
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading admins...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAdmins.map((admin) => (
                <AdminCard
                  key={admin.id}
                  admin={admin}
                  currentAdminAddress={currentAdminAddress}
                  onUpdateRole={handleUpdateRole}
                  onDeactivate={handleDeactivateAdmin}
                  onViewActivity={handleViewActivity}
                />
              ))}
            </div>
          )}

          {filteredAdmins.length === 0 && !loading && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">No Admins Found</h3>
                <p className="text-slate-400">No admins match your current filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <AdminActivityLog activities={activities} />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(ADMIN_ROLES).map(([key, role]) => (
              <Card key={key} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    {role.icon}
                    <span>{role.name}</span>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(role.permissions).map(([permission, allowed]) => (
                      <div key={permission} className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">
                          {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        {allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
