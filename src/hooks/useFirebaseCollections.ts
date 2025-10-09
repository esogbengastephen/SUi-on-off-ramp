import { useState, useEffect } from 'react';
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
  Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

export interface FirebasePayment {
  id?: string;
  transactionId: string;
  paystackReference: string;
  amount: number;
  currency: string;
  status: string;
  webhookData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseAuditLog {
  id?: string;
  adminAddress: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface FirebaseSystemHealth {
  id?: string;
  serviceName: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  responseTime?: number;
  errorMessage?: string;
  createdAt: Date;
}

export interface FirebaseUser {
  id?: string;
  walletAddress: string;
  email?: string;
  phone?: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycData?: any;
  role?: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Payments hook
export function useFirebasePayments() {
  const [payments, setPayments] = useState<FirebasePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.PAYMENTS),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as FirebasePayment[];
        
        setPayments(paymentsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Firebase payments error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addPayment = async (payment: Omit<FirebasePayment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
        ...payment,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  const updatePayment = async (id: string, updates: Partial<FirebasePayment>) => {
    try {
      const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  };

  const getPaymentsByTransaction = (transactionId: string) => {
    return payments.filter(payment => payment.transactionId === transactionId);
  };

  const getPaymentsByStatus = (status: string) => {
    return payments.filter(payment => payment.status === status);
  };

  return { 
    payments, 
    loading, 
    error, 
    addPayment, 
    updatePayment,
    getPaymentsByTransaction,
    getPaymentsByStatus
  };
}

// Audit logs hook
export function useFirebaseAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<FirebaseAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      orderBy('createdAt', 'desc'),
      limit(100) // Limit to last 100 logs for performance
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const logsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as FirebaseAuditLog[];
        
        setAuditLogs(logsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Firebase audit logs error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addAuditLog = async (log: Omit<FirebaseAuditLog, 'id' | 'createdAt'>) => {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        ...log,
        createdAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding audit log:', error);
      throw error;
    }
  };

  const getLogsByAdmin = (adminAddress: string) => {
    return auditLogs.filter(log => log.adminAddress === adminAddress);
  };

  const getLogsByAction = (action: string) => {
    return auditLogs.filter(log => log.action === action);
  };

  return { 
    auditLogs, 
    loading, 
    error, 
    addAuditLog,
    getLogsByAdmin,
    getLogsByAction
  };
}

// System health hook
export function useFirebaseSystemHealth() {
  const [systemHealth, setSystemHealth] = useState<FirebaseSystemHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.SYSTEM_HEALTH),
      orderBy('createdAt', 'desc'),
      limit(50) // Limit to last 50 health checks
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const healthData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as FirebaseSystemHealth[];
        
        setSystemHealth(healthData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Firebase system health error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addHealthCheck = async (health: Omit<FirebaseSystemHealth, 'id' | 'createdAt'>) => {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTIONS.SYSTEM_HEALTH), {
        ...health,
        createdAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding health check:', error);
      throw error;
    }
  };

  const getHealthByService = (serviceName: string) => {
    return systemHealth.filter(health => health.serviceName === serviceName);
  };

  const getLatestHealthByService = (serviceName: string) => {
    const serviceHealth = getHealthByService(serviceName);
    return serviceHealth.length > 0 ? serviceHealth[0] : null;
  };

  const getOverallSystemStatus = () => {
    const services = ['firebase', 'paystack', 'coingecko', 'sui-network'];
    const statuses = services.map(service => {
      const latest = getLatestHealthByService(service);
      return {
        service,
        status: latest?.status || 'DOWN',
        responseTime: latest?.responseTime,
        lastCheck: latest?.createdAt
      };
    });

    const downServices = statuses.filter(s => s.status === 'DOWN').length;
    const degradedServices = statuses.filter(s => s.status === 'DEGRADED').length;

    if (downServices > 0) return 'DOWN';
    if (degradedServices > 0) return 'DEGRADED';
    return 'HEALTHY';
  };

  return { 
    systemHealth, 
    loading, 
    error, 
    addHealthCheck,
    getHealthByService,
    getLatestHealthByService,
    getOverallSystemStatus
  };
}

// Users hook
export function useFirebaseUsers() {
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as FirebaseUser[];
        
        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Firebase users error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addUser = async (user: Omit<FirebaseUser, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...user,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<FirebaseUser>) => {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const getUserByWallet = (walletAddress: string) => {
    return users.find(user => user.walletAddress === walletAddress);
  };

  const getUsersByKycStatus = (kycStatus: FirebaseUser['kycStatus']) => {
    return users.filter(user => user.kycStatus === kycStatus);
  };

  const getAdminUsers = () => {
    return users.filter(user => user.role === 'admin');
  };

  return { 
    users, 
    loading, 
    error, 
    addUser, 
    updateUser,
    getUserByWallet,
    getUsersByKycStatus,
    getAdminUsers
  };
}
