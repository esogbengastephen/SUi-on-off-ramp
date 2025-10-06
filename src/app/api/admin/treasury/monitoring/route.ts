import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase-admin/firestore';

// Treasury balance thresholds for different currencies
const TREASURY_THRESHOLDS = {
  'SUI': {
    low: 100,
    critical: 50,
    high: 1000
  },
  'USDC': {
    low: 1000,
    critical: 500,
    high: 10000
  },
  'USDT': {
    low: 1000,
    critical: 500,
    high: 10000
  },
  'NAIRA': {
    low: 100000,
    critical: 50000,
    high: 1000000
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TREASURY MONITORING: Starting automated treasury monitoring');

    // Get current treasury balances
    const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/treasury/balance`);
    const balanceData = await balanceResponse.json();

    if (!balanceData.success) {
      throw new Error('Failed to fetch treasury balances');
    }

    console.log('🚀 TREASURY MONITORING: Current balances:', balanceData.balances);

    const alertsCreated = [];

    // Check each balance against thresholds
    for (const balance of balanceData.balances) {
      const thresholds = TREASURY_THRESHOLDS[balance.currency as keyof typeof TREASURY_THRESHOLDS];
      
      if (!thresholds) {
        console.log(`⚠️ TREASURY MONITORING: No thresholds defined for ${balance.currency}`);
        continue;
      }

      const { low, critical, high } = thresholds;
      const availableBalance = balance.availableBalance;

      console.log(`🚀 TREASURY MONITORING: Checking ${balance.currency}:`, {
        availableBalance,
        low,
        critical,
        high
      });

      // Check for critical low balance
      if (availableBalance < critical) {
        const alertCreated = await createLowBalanceAlert(
          balance.currency,
          availableBalance,
          critical,
          'CRITICAL'
        );
        if (alertCreated) alertsCreated.push(alertCreated);
      }
      // Check for low balance
      else if (availableBalance < low) {
        const alertCreated = await createLowBalanceAlert(
          balance.currency,
          availableBalance,
          low,
          'HIGH'
        );
        if (alertCreated) alertsCreated.push(alertCreated);
      }
      // Check for high balance (good news)
      else if (availableBalance > high) {
        const alertCreated = await createHighBalanceAlert(
          balance.currency,
          availableBalance,
          high
        );
        if (alertCreated) alertsCreated.push(alertCreated);
      }
    }

    // Check for failed transactions that might indicate issues
    await checkFailedTransactions();

    console.log('✅ TREASURY MONITORING: Monitoring completed, alerts created:', alertsCreated.length);

    return NextResponse.json({
      success: true,
      message: 'Treasury monitoring completed',
      alertsCreated: alertsCreated.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ TREASURY MONITORING: Error during monitoring:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Treasury monitoring failed' 
      },
      { status: 500 }
    );
  }
}

// Create low balance alert
async function createLowBalanceAlert(currency: string, currentBalance: number, threshold: number, severity: 'HIGH' | 'CRITICAL') {
  try {
    console.log(`🚨 LOW BALANCE ALERT: Creating ${severity} alert for ${currency}`);

    // Check if alert already exists
    const alertsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_ALERTS);
    const existingAlertQuery = query(
      alertsRef,
      where('type', '==', 'LOW_BALANCE'),
      where('currency', '==', currency),
      where('severity', '==', severity),
      where('acknowledged', '==', false)
    );
    
    const existingSnapshot = await getDocs(existingAlertQuery);
    
    if (!existingSnapshot.empty) {
      console.log(`⚠️ LOW BALANCE ALERT: Alert already exists for ${currency} ${severity}`);
      return null;
    }

    // Create new alert
    const alertData = {
      type: 'LOW_BALANCE',
      severity,
      message: `${severity === 'CRITICAL' ? 'CRITICAL' : 'Low'} ${currency} balance: ${currentBalance.toLocaleString()} (threshold: ${threshold.toLocaleString()})`,
      currency,
      amount: currentBalance,
      threshold,
      acknowledged: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(alertsRef, alertData);
    
    console.log(`✅ LOW BALANCE ALERT: Created ${severity} alert for ${currency} with ID: ${docRef.id}`);

    // Send immediate notification for critical alerts
    if (severity === 'CRITICAL') {
      await sendCriticalAlertNotification(alertData);
    }

    return docRef.id;

  } catch (error) {
    console.error(`❌ LOW BALANCE ALERT: Error creating alert for ${currency}:`, error);
    return null;
  }
}

// Create high balance alert (good news)
async function createHighBalanceAlert(currency: string, currentBalance: number, threshold: number) {
  try {
    console.log(`📈 HIGH BALANCE ALERT: Creating alert for ${currency}`);

    // Check if alert already exists
    const alertsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_ALERTS);
    const existingAlertQuery = query(
      alertsRef,
      where('type', '==', 'HIGH_BALANCE'),
      where('currency', '==', currency),
      where('acknowledged', '==', false)
    );
    
    const existingSnapshot = await getDocs(existingAlertQuery);
    
    if (!existingSnapshot.empty) {
      console.log(`⚠️ HIGH BALANCE ALERT: Alert already exists for ${currency}`);
      return null;
    }

    // Create new alert
    const alertData = {
      type: 'HIGH_BALANCE',
      severity: 'LOW',
      message: `High ${currency} balance: ${currentBalance.toLocaleString()} (threshold: ${threshold.toLocaleString()}) - Good liquidity!`,
      currency,
      amount: currentBalance,
      threshold,
      acknowledged: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(alertsRef, alertData);
    
    console.log(`✅ HIGH BALANCE ALERT: Created alert for ${currency} with ID: ${docRef.id}`);

    return docRef.id;

  } catch (error) {
    console.error(`❌ HIGH BALANCE ALERT: Error creating alert for ${currency}:`, error);
    return null;
  }
}

// Check for failed transactions
async function checkFailedTransactions() {
  try {
    console.log('🚀 FAILED TRANSACTION CHECK: Checking for failed transactions');

    // Get recent failed transactions (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    const transactionsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_TRANSACTIONS);
    const failedQuery = query(
      transactionsRef,
      where('status', '==', 'FAILED'),
      where('createdAt', '>=', oneHourAgo),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const failedSnapshot = await getDocs(failedQuery);
    const failedTransactions = failedSnapshot.docs.map(doc => doc.data());

    if (failedTransactions.length >= 3) {
      console.log(`🚨 FAILED TRANSACTION ALERT: ${failedTransactions.length} failed transactions in the last hour`);
      
      // Check if alert already exists
      const alertsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_ALERTS);
      const existingAlertQuery = query(
        alertsRef,
        where('type', '==', 'FAILED_TRANSACTION'),
        where('acknowledged', '==', false),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const existingSnapshot = await getDocs(existingAlertQuery);
      
      if (existingSnapshot.empty || 
          (existingSnapshot.docs[0].data().createdAt.toDate().getTime() < Date.now() - 3600000)) {
        
        // Create failed transaction alert
        const alertData = {
          type: 'FAILED_TRANSACTION',
          severity: 'HIGH',
          message: `High number of failed transactions: ${failedTransactions.length} failures in the last hour`,
          acknowledged: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await addDoc(alertsRef, alertData);
        console.log('✅ FAILED TRANSACTION ALERT: Created alert for high failure rate');
      }
    }

  } catch (error) {
    console.error('❌ FAILED TRANSACTION CHECK: Error checking failed transactions:', error);
  }
}

// Send critical alert notification
async function sendCriticalAlertNotification(alertData: any) {
  try {
    console.log('🚨 CRITICAL NOTIFICATION: Sending critical alert notification');

    // In a real implementation, this would send:
    // - Email to admin
    // - SMS to admin
    // - Slack/Discord notification
    // - Push notification to admin dashboard

    console.log('📧 CRITICAL NOTIFICATION: Would send email notification');
    console.log('📱 CRITICAL NOTIFICATION: Would send SMS notification');
    console.log('💬 CRITICAL NOTIFICATION: Would send Slack notification');

    // For now, we'll just log the notification
    console.log('🚨 CRITICAL ALERT NOTIFICATION:', {
      currency: alertData.currency,
      amount: alertData.amount,
      threshold: alertData.threshold,
      message: alertData.message
    });

  } catch (error) {
    console.error('❌ CRITICAL NOTIFICATION: Error sending notification:', error);
  }
}

// Health check endpoint
export async function POST() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'treasury-monitoring',
    timestamp: new Date().toISOString()
  });
}
