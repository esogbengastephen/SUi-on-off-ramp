"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc,
  where,
  limit,
  getDocs,
  deleteDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ADMIN_COLLECTIONS,
  AdminUser,
  AdminSession,
  AdminActivity,
  TreasurySnapshot,
  TreasuryAlert,
  TreasuryOperation,
  TransactionOverride,
  BulkOperation,
  UserProfile,
  UserActivity,
  DailyAnalytics,
  CustomReport,
  ReportExecution,
  AdminSettings,
  SystemAlert,
  NotificationTemplate,
  FilterCriteria,
  PaginatedQuery
} from '@/lib/firebase-admin-schema';
import { toast } from 'sonner';

// ===== ADMIN USER MANAGEMENT =====

export function useAdminUsers() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.ADMIN_USERS),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          enrolledAt: doc.data().enrolledAt?.toDate() || new Date(),
          lastLoginAt: doc.data().lastLoginAt?.toDate()
        })) as AdminUser[];
        
        setAdminUsers(users);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching admin users:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const enrollAdmin = useCallback(async (adminData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, ADMIN_COLLECTIONS.ADMIN_USERS), {
        ...adminData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        enrolledAt: Timestamp.now()
      });
      
      // Log admin activity
      await logAdminActivity({
        adminWalletAddress: adminData.enrolledBy,
        action: 'ENROLL_ADMIN',
        targetType: 'ADMIN',
        targetId: docRef.id,
        details: { enrolledWallet: adminData.walletAddress, role: adminData.role }
      });
      
      toast.success('Admin enrolled successfully');
      return docRef.id;
    } catch (error: any) {
      console.error('Error enrolling admin:', error);
      toast.error('Failed to enroll admin');
      throw error;
    }
  }, []);

  const updateAdminRole = useCallback(async (adminId: string, newRole: AdminUser['role'], updatedBy: string) => {
    try {
      await updateDoc(doc(db, ADMIN_COLLECTIONS.ADMIN_USERS, adminId), {
        role: newRole,
        updatedAt: Timestamp.now()
      });
      
      await logAdminActivity({
        adminWalletAddress: updatedBy,
        action: 'UPDATE_ADMIN_ROLE',
        targetType: 'ADMIN',
        targetId: adminId,
        details: { newRole }
      });
      
      toast.success('Admin role updated successfully');
    } catch (error: any) {
      console.error('Error updating admin role:', error);
      toast.error('Failed to update admin role');
      throw error;
    }
  }, []);

  const deactivateAdmin = useCallback(async (adminId: string, deactivatedBy: string) => {
    try {
      await updateDoc(doc(db, ADMIN_COLLECTIONS.ADMIN_USERS, adminId), {
        isActive: false,
        updatedAt: Timestamp.now()
      });
      
      await logAdminActivity({
        adminWalletAddress: deactivatedBy,
        action: 'DEACTIVATE_ADMIN',
        targetType: 'ADMIN',
        targetId: adminId,
        details: {}
      });
      
      toast.success('Admin deactivated successfully');
    } catch (error: any) {
      console.error('Error deactivating admin:', error);
      toast.error('Failed to deactivate admin');
      throw error;
    }
  }, []);

  return {
    adminUsers,
    loading,
    error,
    enrollAdmin,
    updateAdminRole,
    deactivateAdmin
  };
}

// ===== ADMIN ACTIVITY LOGGING =====

export function useAdminActivity() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.ADMIN_ACTIVITIES),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activityList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AdminActivity[];
      
      setActivities(activityList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { activities, loading };
}

export const logAdminActivity = async (activity: Omit<AdminActivity, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, ADMIN_COLLECTIONS.ADMIN_ACTIVITIES), {
      ...activity,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
};

// ===== TREASURY MANAGEMENT =====

export function useTreasurySnapshots() {
  const [snapshots, setSnapshots] = useState<TreasurySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestSnapshot, setLatestSnapshot] = useState<TreasurySnapshot | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.TREASURY_SNAPSHOTS),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const snapshotList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        balances: {
          SUI: {
            ...doc.data().balances?.SUI,
            lastUpdated: doc.data().balances?.SUI?.lastUpdated?.toDate() || new Date()
          },
          USDC: {
            ...doc.data().balances?.USDC,
            lastUpdated: doc.data().balances?.USDC?.lastUpdated?.toDate() || new Date()
          },
          USDT: {
            ...doc.data().balances?.USDT,
            lastUpdated: doc.data().balances?.USDT?.lastUpdated?.toDate() || new Date()
          },
          NAIRA: {
            ...doc.data().balances?.NAIRA,
            lastUpdated: doc.data().balances?.NAIRA?.lastUpdated?.toDate() || new Date()
          }
        }
      })) as TreasurySnapshot[];
      
      setSnapshots(snapshotList);
      setLatestSnapshot(snapshotList[0] || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createSnapshot = useCallback(async (snapshotData: Omit<TreasurySnapshot, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, ADMIN_COLLECTIONS.TREASURY_SNAPSHOTS), {
        ...snapshotData,
        timestamp: Timestamp.now(),
        balances: {
          SUI: {
            ...snapshotData.balances.SUI,
            lastUpdated: Timestamp.now()
          },
          USDC: {
            ...snapshotData.balances.USDC,
            lastUpdated: Timestamp.now()
          },
          USDT: {
            ...snapshotData.balances.USDT,
            lastUpdated: Timestamp.now()
          },
          NAIRA: {
            ...snapshotData.balances.NAIRA,
            lastUpdated: Timestamp.now()
          }
        }
      });
    } catch (error: any) {
      console.error('Error creating treasury snapshot:', error);
      throw error;
    }
  }, []);

  return {
    snapshots,
    latestSnapshot,
    loading,
    createSnapshot
  };
}

// ===== TREASURY ALERTS =====

export function useTreasuryAlerts() {
  const [alerts, setAlerts] = useState<TreasuryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.TREASURY_ALERTS),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        acknowledgedAt: doc.data().acknowledgedAt?.toDate()
      })) as TreasuryAlert[];
      
      setAlerts(alertList);
      setUnacknowledgedCount(alertList.filter(alert => !alert.acknowledged).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createAlert = useCallback(async (alertData: Omit<TreasuryAlert, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, ADMIN_COLLECTIONS.TREASURY_ALERTS), {
        ...alertData,
        createdAt: Timestamp.now()
      });
    } catch (error: any) {
      console.error('Error creating treasury alert:', error);
      throw error;
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string, acknowledgedBy: string) => {
    try {
      await updateDoc(doc(db, ADMIN_COLLECTIONS.TREASURY_ALERTS, alertId), {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: Timestamp.now()
      });
      
      toast.success('Alert acknowledged');
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
      throw error;
    }
  }, []);

  return {
    alerts,
    loading,
    unacknowledgedCount,
    createAlert,
    acknowledgeAlert
  };
}

// ===== TRANSACTION OVERRIDES =====

export function useTransactionOverrides() {
  const [overrides, setOverrides] = useState<TransactionOverride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.TRANSACTION_OVERRIDES),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const overrideList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as TransactionOverride[];
      
      setOverrides(overrideList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createOverride = useCallback(async (overrideData: Omit<TransactionOverride, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, ADMIN_COLLECTIONS.TRANSACTION_OVERRIDES), {
        ...overrideData,
        createdAt: Timestamp.now()
      });
      
      await logAdminActivity({
        adminWalletAddress: overrideData.adminWalletAddress,
        action: 'OVERRIDE_TRANSACTION',
        targetType: 'TRANSACTION',
        targetId: overrideData.transactionId,
        details: { 
          originalStatus: overrideData.originalStatus,
          newStatus: overrideData.newStatus,
          reason: overrideData.reason
        }
      });
      
      toast.success('Transaction override created');
    } catch (error: any) {
      console.error('Error creating transaction override:', error);
      toast.error('Failed to create transaction override');
      throw error;
    }
  }, []);

  return {
    overrides,
    loading,
    createOverride
  };
}

// ===== BULK OPERATIONS =====

export function useBulkOperations() {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.BULK_OPERATIONS),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const operationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate()
      })) as BulkOperation[];
      
      setOperations(operationList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createBulkOperation = useCallback(async (operationData: Omit<BulkOperation, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, ADMIN_COLLECTIONS.BULK_OPERATIONS), {
        ...operationData,
        createdAt: Timestamp.now()
      });
      
      await logAdminActivity({
        adminWalletAddress: operationData.adminWalletAddress,
        action: 'BULK_OPERATION',
        targetType: 'TRANSACTION',
        targetId: docRef.id,
        details: { 
          operationType: operationData.operationType,
          transactionCount: operationData.transactionIds.length
        }
      });
      
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating bulk operation:', error);
      throw error;
    }
  }, []);

  const updateBulkOperation = useCallback(async (operationId: string, updates: Partial<BulkOperation>) => {
    try {
      await updateDoc(doc(db, ADMIN_COLLECTIONS.BULK_OPERATIONS, operationId), {
        ...updates,
        ...(updates.status === 'COMPLETED' && { completedAt: Timestamp.now() })
      });
    } catch (error: any) {
      console.error('Error updating bulk operation:', error);
      throw error;
    }
  }, []);

  return {
    operations,
    loading,
    createBulkOperation,
    updateBulkOperation
  };
}

// ===== USER PROFILES =====

export function useUserProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.USER_PROFILES),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profileList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastActivityAt: doc.data().lastActivityAt?.toDate(),
        blockedAt: doc.data().blockedAt?.toDate(),
        transactionLimits: {
          ...doc.data().transactionLimits,
          updatedAt: doc.data().transactionLimits?.updatedAt?.toDate()
        }
      })) as UserProfile[];
      
      setProfiles(profileList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfile = useCallback(async (profileId: string, updates: Partial<UserProfile>, updatedBy: string) => {
    try {
      await updateDoc(doc(db, ADMIN_COLLECTIONS.USER_PROFILES, profileId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      await logAdminActivity({
        adminWalletAddress: updatedBy,
        action: 'UPDATE_USER_PROFILE',
        targetType: 'USER',
        targetId: profileId,
        details: updates
      });
      
      toast.success('User profile updated');
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      toast.error('Failed to update user profile');
      throw error;
    }
  }, []);

  const blockUser = useCallback(async (profileId: string, reason: string, blockedBy: string) => {
    try {
      await updateDoc(doc(db, ADMIN_COLLECTIONS.USER_PROFILES, profileId), {
        isBlocked: true,
        blockedBy,
        blockedAt: Timestamp.now(),
        blockReason: reason,
        updatedAt: Timestamp.now()
      });
      
      await logAdminActivity({
        adminWalletAddress: blockedBy,
        action: 'BLOCK_USER',
        targetType: 'USER',
        targetId: profileId,
        details: { reason }
      });
      
      toast.success('User blocked successfully');
    } catch (error: any) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
      throw error;
    }
  }, []);

  const unblockUser = useCallback(async (profileId: string, unblockedBy: string) => {
    try {
      await updateDoc(doc(db, ADMIN_COLLECTIONS.USER_PROFILES, profileId), {
        isBlocked: false,
        blockedBy: null,
        blockedAt: null,
        blockReason: null,
        updatedAt: Timestamp.now()
      });
      
      await logAdminActivity({
        adminWalletAddress: unblockedBy,
        action: 'UNBLOCK_USER',
        targetType: 'USER',
        targetId: profileId,
        details: {}
      });
      
      toast.success('User unblocked successfully');
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
      throw error;
    }
  }, []);

  return {
    profiles,
    loading,
    updateUserProfile,
    blockUser,
    unblockUser
  };
}

// ===== DAILY ANALYTICS =====

export function useDailyAnalytics() {
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.DAILY_ANALYTICS),
      orderBy('date', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const analyticsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as DailyAnalytics[];
      
      setAnalytics(analyticsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createDailyAnalytics = useCallback(async (analyticsData: Omit<DailyAnalytics, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, ADMIN_COLLECTIONS.DAILY_ANALYTICS), {
        ...analyticsData,
        createdAt: Timestamp.now()
      });
    } catch (error: any) {
      console.error('Error creating daily analytics:', error);
      throw error;
    }
  }, []);

  return {
    analytics,
    loading,
    createDailyAnalytics
  };
}

// ===== SYSTEM ALERTS =====

export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.SYSTEM_ALERTS),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate()
      })) as SystemAlert[];
      
      setAlerts(alertList);
      setUnresolvedCount(alertList.filter(alert => !alert.resolved).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createSystemAlert = useCallback(async (alertData: Omit<SystemAlert, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, ADMIN_COLLECTIONS.SYSTEM_ALERTS), {
        ...alertData,
        createdAt: Timestamp.now()
      });
    } catch (error: any) {
      console.error('Error creating system alert:', error);
      throw error;
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: string, resolvedBy: string) => {
    try {
      await updateDoc(doc(db, ADMIN_COLLECTIONS.SYSTEM_ALERTS, alertId), {
        resolved: true,
        resolvedBy,
        resolvedAt: Timestamp.now()
      });
      
      toast.success('Alert resolved');
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
      throw error;
    }
  }, []);

  return {
    alerts,
    loading,
    unresolvedCount,
    createSystemAlert,
    resolveAlert
  };
}

// ===== ADMIN SETTINGS =====

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, ADMIN_COLLECTIONS.ADMIN_SETTINGS),
      orderBy('category')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const settingsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as AdminSettings[];
      
      setSettings(settingsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSetting = useCallback(async (key: string, value: any, updatedBy: string, category?: string) => {
    try {
      // Check if setting exists
      const q = query(
        collection(db, ADMIN_COLLECTIONS.ADMIN_SETTINGS),
        where('key', '==', key)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create new setting
        await addDoc(collection(db, ADMIN_COLLECTIONS.ADMIN_SETTINGS), {
          category: category || 'GENERAL',
          key,
          value,
          updatedBy,
          updatedAt: Timestamp.now()
        });
      } else {
        // Update existing setting
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, ADMIN_COLLECTIONS.ADMIN_SETTINGS, docId), {
          value,
          updatedBy,
          updatedAt: Timestamp.now()
        });
      }
      
      await logAdminActivity({
        adminWalletAddress: updatedBy,
        action: 'UPDATE_SETTINGS',
        targetType: 'SYSTEM',
        targetId: key,
        details: { key, value }
      });
      
      toast.success('Setting updated successfully');
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      throw error;
    }
  }, []);

  const getSetting = useCallback((key: string): any => {
    const setting = settings.find(s => s.key === key);
    return setting?.value;
  }, [settings]);

  return {
    settings,
    loading,
    updateSetting,
    getSetting
  };
}
