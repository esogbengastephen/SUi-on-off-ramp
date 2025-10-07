"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  walletAddress: string;
  isEmailVerified: boolean;
  role: 'user' | 'admin';
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  phone?: string | null;
  referralCode?: string | null;
  totalReferrals: number;
  signupSource: string;
}

export interface UserListData {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search: string;
    status: string;
  };
  lastUpdated: string;
}

export function useUserList() {
  const [data, setData] = useState<UserListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserList = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = 'all'
  ) => {
    try {
      console.log('🚀 USER LIST: Fetching user list');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status
      });
      
      const response = await fetch(`/api/admin/users/list?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user list');
      }
      
      setData(result.data);
      setError(null);
      
      console.log('✅ USER LIST: Successfully fetched user list:', result.data);
    } catch (err: any) {
      console.error('❌ USER LIST: Error fetching user list:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUserList = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = 'all'
  ) => {
    setLoading(true);
    await fetchUserList(page, limit, search, status);
  }, [fetchUserList]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchUserList();
  }, [fetchUserList]);

  return {
    data,
    loading,
    error,
    fetchUserList,
    refreshUserList
  };
}
