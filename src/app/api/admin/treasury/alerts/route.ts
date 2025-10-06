import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { collection, addDoc, updateDoc, doc, query, orderBy, limit, getDocs, where } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TREASURY ALERTS API: Fetching treasury alerts');

    // Get alerts from Firebase
    const alertsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_ALERTS);
    const q = query(
      alertsRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));

    console.log('🚀 TREASURY ALERTS API: Returning alerts:', alerts.length);

    return NextResponse.json({
      success: true,
      alerts,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ TREASURY ALERTS API: Error fetching alerts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch treasury alerts' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 TREASURY ALERTS API: Creating treasury alert');
    
    const body = await request.json();
    const { type, severity, message, currency, amount, threshold } = body;

    // Validate required parameters
    if (!type || !severity || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: type, severity, message' 
        },
        { status: 400 }
      );
    }

    // Validate alert type
    if (!['LOW_BALANCE', 'HIGH_VOLUME', 'FAILED_TRANSACTION', 'SYSTEM_ERROR'].includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid alert type' 
        },
        { status: 400 }
      );
    }

    // Validate severity
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid alert severity' 
        },
        { status: 400 }
      );
    }

    // Create alert record in Firebase
    const alertsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_ALERTS);
    const docRef = await addDoc(alertsRef, {
      type,
      severity,
      message,
      currency: currency || '',
      amount: amount || 0,
      threshold: threshold || 0,
      acknowledged: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ TREASURY ALERTS API: Alert created with ID:', docRef.id);

    // Send notification based on severity
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      console.log('🚨 CRITICAL/HIGH ALERT: Sending immediate notification');
      // In a real implementation, this would send email/SMS notifications
    }

    return NextResponse.json({
      success: true,
      alertId: docRef.id,
      message: 'Treasury alert created successfully'
    });

  } catch (error: any) {
    console.error('❌ TREASURY ALERTS API: Error creating alert:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create treasury alert' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 TREASURY ALERTS API: Updating treasury alert');
    
    const body = await request.json();
    const { alertId, acknowledged } = body;

    // Validate required parameters
    if (!alertId || acknowledged === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: alertId, acknowledged' 
        },
        { status: 400 }
      );
    }

    // Update alert in Firebase
    const alertRef = doc(adminDb, ADMIN_COLLECTIONS.TREASURY_ALERTS, alertId);
    await updateDoc(alertRef, {
      acknowledged: Boolean(acknowledged),
      updatedAt: new Date()
    });

    console.log('✅ TREASURY ALERTS API: Alert updated:', alertId);

    return NextResponse.json({
      success: true,
      message: 'Treasury alert updated successfully'
    });

  } catch (error: any) {
    console.error('❌ TREASURY ALERTS API: Error updating alert:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update treasury alert' 
      },
      { status: 500 }
    );
  }
}

// Helper function to check for low balance alerts
export async function checkLowBalanceAlerts() {
  try {
    console.log('🚀 TREASURY ALERTS: Checking for low balance alerts');

    // Get current balances
    const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/treasury/balance`);
    const balanceData = await balanceResponse.json();

    if (!balanceData.success) {
      throw new Error('Failed to fetch treasury balances');
    }

    const LOW_BALANCE_THRESHOLDS = {
      'SUI': 100,
      'USDC': 1000,
      'USDT': 1000,
      'NAIRA': 100000
    };

    // Check each balance against thresholds
    for (const balance of balanceData.balances) {
      const threshold = LOW_BALANCE_THRESHOLDS[balance.currency as keyof typeof LOW_BALANCE_THRESHOLDS];
      
      if (threshold && balance.availableBalance < threshold) {
        // Check if alert already exists
        const alertsRef = collection(adminDb, ADMIN_COLLECTIONS.TREASURY_ALERTS);
        const existingAlertQuery = query(
          alertsRef,
          where('type', '==', 'LOW_BALANCE'),
          where('currency', '==', balance.currency),
          where('acknowledged', '==', false)
        );
        
        const existingSnapshot = await getDocs(existingAlertQuery);
        
        if (existingSnapshot.empty) {
          // Create new alert
          const severity = balance.availableBalance < threshold * 0.5 ? 'CRITICAL' : 'HIGH';
          
          await addDoc(alertsRef, {
            type: 'LOW_BALANCE',
            severity,
            message: `Low ${balance.currency} balance: ${balance.availableBalance.toLocaleString()} (threshold: ${threshold.toLocaleString()})`,
            currency: balance.currency,
            amount: balance.availableBalance,
            threshold,
            acknowledged: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          console.log(`🚨 LOW BALANCE ALERT: Created ${severity} alert for ${balance.currency}`);
        }
      }
    }

    console.log('✅ TREASURY ALERTS: Low balance check completed');

  } catch (error) {
    console.error('❌ TREASURY ALERTS: Error checking low balance alerts:', error);
  }
}
