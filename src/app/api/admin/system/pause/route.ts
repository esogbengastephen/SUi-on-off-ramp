import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// GET - Check system pause status
export async function GET() {
  try {
    const systemDoc = await getDoc(doc(db, 'systemSettings', 'main'));
    
    if (!systemDoc.exists()) {
      return NextResponse.json({
        systemPaused: false,
        pauseReason: null,
        pausedAt: null,
        pausedBy: null
      });
    }

    const data = systemDoc.data();
    return NextResponse.json({
      systemPaused: data.systemPaused || false,
      pauseReason: data.pauseReason || null,
      pausedAt: data.pausedAt || null,
      pausedBy: data.pausedBy || null,
      resumedAt: data.resumedAt || null,
      resumedBy: data.resumedBy || null
    });

  } catch (error) {
    console.error('Failed to get system status:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}

// POST - Pause or resume system
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, reason, adminAddress } = body;

    if (!action || !adminAddress) {
      return NextResponse.json(
        { error: 'Action and admin address are required' },
        { status: 400 }
      );
    }

    if (action === 'pause' && !reason) {
      return NextResponse.json(
        { error: 'Reason is required for pausing system' },
        { status: 400 }
      );
    }

    const systemDocRef = doc(db, 'systemSettings', 'main');
    const timestamp = new Date();

    if (action === 'pause') {
      await setDoc(systemDocRef, {
        systemPaused: true,
        pauseReason: reason,
        pausedAt: timestamp,
        pausedBy: adminAddress,
        lastModified: timestamp,
        modifiedBy: adminAddress
      }, { merge: true });

      // Log the pause action
      await setDoc(doc(db, 'adminActivities', `pause_${Date.now()}`), {
        action: 'PAUSE_SYSTEM',
        adminWalletAddress: adminAddress,
        timestamp,
        details: {
          reason,
          systemPaused: true
        },
        targetType: 'SYSTEM'
      });

      return NextResponse.json({
        success: true,
        message: 'System paused successfully',
        systemPaused: true,
        pauseReason: reason,
        pausedAt: timestamp,
        pausedBy: adminAddress
      });

    } else if (action === 'resume') {
      await updateDoc(systemDocRef, {
        systemPaused: false,
        pauseReason: null,
        resumedAt: timestamp,
        resumedBy: adminAddress,
        lastModified: timestamp,
        modifiedBy: adminAddress
      });

      // Log the resume action
      await setDoc(doc(db, 'adminActivities', `resume_${Date.now()}`), {
        action: 'RESUME_SYSTEM',
        adminWalletAddress: adminAddress,
        timestamp,
        details: {
          systemPaused: false
        },
        targetType: 'SYSTEM'
      });

      return NextResponse.json({
        success: true,
        message: 'System resumed successfully',
        systemPaused: false,
        resumedAt: timestamp,
        resumedBy: adminAddress
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "pause" or "resume"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Failed to update system status:', error);
    return NextResponse.json(
      { error: 'Failed to update system status' },
      { status: 500 }
    );
  }
}
