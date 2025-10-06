"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface SystemSettings {
  systemPaused: boolean;
  pauseReason?: string;
  pausedAt?: Date;
  pausedBy?: string;
  resumedAt?: Date;
  resumedBy?: string;
  priceOverrides: {
    [key: string]: {
      onRamp: {
        enabled: boolean;
        price: number;
        originalPrice: number;
        lastUpdated?: Date;
        updatedBy?: string;
        reason?: string;
      };
      offRamp: {
        enabled: boolean;
        price: number;
        originalPrice: number;
        lastUpdated?: Date;
        updatedBy?: string;
        reason?: string;
      };
    };
  };
  lastModified?: Date;
  modifiedBy?: string;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    systemPaused: false,
    priceOverrides: {
      SUI: { 
        onRamp: { enabled: false, price: 0, originalPrice: 0 },
        offRamp: { enabled: false, price: 0, originalPrice: 0 }
      },
      USDC: { 
        onRamp: { enabled: false, price: 0, originalPrice: 0 },
        offRamp: { enabled: false, price: 0, originalPrice: 0 }
      },
      USDT: { 
        onRamp: { enabled: false, price: 0, originalPrice: 0 },
        offRamp: { enabled: false, price: 0, originalPrice: 0 }
      }
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const systemDocRef = doc(db, 'systemSettings', 'main');
    
    const unsubscribe = onSnapshot(systemDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSettings({
          systemPaused: data.systemPaused || false,
          pauseReason: data.pauseReason,
          pausedAt: data.pausedAt?.toDate(),
          pausedBy: data.pausedBy,
          resumedAt: data.resumedAt?.toDate(),
          resumedBy: data.resumedBy,
          priceOverrides: data.priceOverrides || {
            SUI: { 
              onRamp: { enabled: false, price: 0, originalPrice: 0 },
              offRamp: { enabled: false, price: 0, originalPrice: 0 }
            },
            USDC: { 
              onRamp: { enabled: false, price: 0, originalPrice: 0 },
              offRamp: { enabled: false, price: 0, originalPrice: 0 }
            },
            USDT: { 
              onRamp: { enabled: false, price: 0, originalPrice: 0 },
              offRamp: { enabled: false, price: 0, originalPrice: 0 }
            }
          },
          lastModified: data.lastModified?.toDate(),
          modifiedBy: data.modifiedBy
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching system settings:', error);
      toast.error('Failed to load system settings');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    try {
      const systemDocRef = doc(db, 'systemSettings', 'main');
      await updateDoc(systemDocRef, {
        ...updates,
        lastModified: new Date(),
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  };

  const createSettings = async (settings: Partial<SystemSettings>) => {
    try {
      const systemDocRef = doc(db, 'systemSettings', 'main');
      await setDoc(systemDocRef, {
        ...settings,
        lastModified: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error creating system settings:', error);
      throw error;
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    createSettings
  };
}

export function usePriceOverrides() {
  const [overrides, setOverrides] = useState<SystemSettings['priceOverrides']>({
    SUI: { enabled: false, price: 0, originalPrice: 0 },
    USDC: { enabled: false, price: 0, originalPrice: 0 },
    USDT: { enabled: false, price: 0, originalPrice: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const priceDocRef = doc(db, 'systemSettings', 'priceOverrides');
    
    const unsubscribe = onSnapshot(priceDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOverrides(data as SystemSettings['priceOverrides']);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching price overrides:', error);
      toast.error('Failed to load price overrides');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOverride = async (token: string, override: any) => {
    try {
      const priceDocRef = doc(db, 'systemSettings', 'priceOverrides');
      await updateDoc(priceDocRef, {
        [token]: override
      });
    } catch (error) {
      console.error('Error updating price override:', error);
      throw error;
    }
  };

  return {
    overrides,
    loading,
    updateOverride
  };
}
