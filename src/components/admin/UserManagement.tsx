"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealDashboardData } from "@/hooks/useRealDashboardData";
import { useUserList, User } from "@/hooks/useUserList";
import { toast } from "sonner";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Shield,
  Activity,
  Eye
} from "lucide-react";

export default function UserManagement() {
  const { userData, refresh: refreshRealData } = useRealDashboardData();
  const { data: userListData, loading: userListLoading, refreshUserList } = useUserList();
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshRealData(),
        refreshUserList(currentPage, 10, searchTerm, filterStatus)
      ]);
      toast.success('User data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh user data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    refreshUserList(1, 10, value, filterStatus);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
    refreshUserList(1, 10, searchTerm, value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    refreshUserList(page, 10, searchTerm, filterStatus);
  };

  const formatLastActivity = (lastLoginAt: Date | null) => {
    if (!lastLoginAt) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastLoginAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-8">
      {/* User Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Users</p>
                  <p className="text-white text-2xl font-bold">{userData.totalUsers}</p>
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
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Active Users</p>
                  <p className="text-white text-2xl font-bold">{userData.activeUsers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Verified Users</p>
                  <p className="text-white text-2xl font-bold">{userData.verifiedUsers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Pending Users</p>
                  <p className="text-white text-2xl font-bold">{userData.pendingUsers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Search and Filters */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>User Search</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Search and filter users by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Search by email, name, or wallet address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="verified">Verified Users</SelectItem>
                  <SelectItem value="pending">Pending Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh User Data
            </Button>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>User Statistics</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Real-time user activity and verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Verification Rate</span>
                <Badge className="bg-green-500 text-white">
                  {userData.totalUsers > 0 ? ((userData.verifiedUsers / userData.totalUsers) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Activity Rate</span>
                <Badge className="bg-blue-500 text-white">
                  {userData.totalUsers > 0 ? ((userData.activeUsers / userData.totalUsers) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Pending Rate</span>
                <Badge className="bg-orange-500 text-white">
                  {userData.totalUsers > 0 ? ((userData.pendingUsers / userData.totalUsers) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Last Updated</span>
                <span className="text-slate-400 text-sm">
                  {userData.lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">User List</CardTitle>
              <CardDescription className="text-slate-400">
                Manage users, verification status, and account settings
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users by email, wallet address..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Email Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Activity</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userListLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                        <span className="text-slate-400">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : userListData?.users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <div className="text-slate-400">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No users found</p>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  userListData?.users.map((user: User) => {
                    const isActive = user.lastLoginAt && 
                      (Date.now() - user.lastLoginAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
                    
                    return (
                      <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {user.email}
                              </div>
                              <div className="text-slate-400 text-sm">
                                {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={isActive ? "default" : "secondary"}
                            className={isActive ? "bg-green-500" : "bg-slate-500"}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={user.isEmailVerified ? "default" : "secondary"}
                            className={user.isEmailVerified ? "bg-green-500" : "bg-slate-500"}
                          >
                            {user.isEmailVerified ? "Verified ✓" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-300 text-sm">
                            {formatLastActivity(user.lastLoginAt)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
            <div className="text-slate-400 text-sm">
              {userListData ? (
                <>
                  Showing {((userListData.pagination.currentPage - 1) * userListData.pagination.limit) + 1}-
                  {Math.min(userListData.pagination.currentPage * userListData.pagination.limit, userListData.pagination.totalUsers)} of {userListData.pagination.totalUsers} users
                </>
              ) : (
                'Loading...'
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!userListData?.pagination.hasPrevPage}
                onClick={() => handlePageChange(currentPage - 1)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:text-slate-400"
              >
                Previous
              </Button>
              <span className="text-slate-400 text-sm px-2">
                Page {userListData?.pagination.currentPage || 1} of {userListData?.pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!userListData?.pagination.hasNextPage}
                onClick={() => handlePageChange(currentPage + 1)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:text-slate-400"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}