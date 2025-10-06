import { NextRequest, NextResponse } from 'next/server';

// This is a simple cron-like service that can be called by external schedulers
// In production, you would use:
// - Vercel Cron Jobs
// - AWS Lambda with EventBridge
// - Google Cloud Functions with Cloud Scheduler
// - Or any other cron service

export async function GET(request: NextRequest) {
  try {
    console.log('🕐 TREASURY CRON: Starting scheduled treasury monitoring');

    // Call the treasury monitoring endpoint
    const monitoringResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/treasury/monitoring`);
    const monitoringData = await monitoringResponse.json();

    if (!monitoringData.success) {
      throw new Error(monitoringData.error || 'Treasury monitoring failed');
    }

    console.log('✅ TREASURY CRON: Scheduled monitoring completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Scheduled treasury monitoring completed',
      alertsCreated: monitoringData.alertsCreated,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ TREASURY CRON: Error during scheduled monitoring:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Scheduled treasury monitoring failed' 
      },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 TREASURY CRON: Manual trigger requested');

    const body = await request.json();
    const { force } = body;

    if (force) {
      console.log('🚀 TREASURY CRON: Force monitoring requested');
      
      // Call the treasury monitoring endpoint
      const monitoringResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/treasury/monitoring`);
      const monitoringData = await monitoringResponse.json();

      if (!monitoringData.success) {
        throw new Error(monitoringData.error || 'Treasury monitoring failed');
      }

      return NextResponse.json({
        success: true,
        message: 'Manual treasury monitoring completed',
        alertsCreated: monitoringData.alertsCreated,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Use force: true to manually trigger monitoring'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ TREASURY CRON: Error during manual monitoring:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Manual treasury monitoring failed' 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function PUT() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'treasury-cron',
    timestamp: new Date().toISOString(),
    nextRun: new Date(Date.now() + 300000).toISOString() // Next run in 5 minutes
  });
}
