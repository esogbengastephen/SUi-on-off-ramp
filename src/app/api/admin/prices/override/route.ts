import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// GET - Get current price overrides
export async function GET() {
  try {
    const priceDoc = await getDoc(doc(db, 'systemSettings', 'priceOverrides'));
    
    if (!priceDoc.exists()) {
      return NextResponse.json({
        SUI: { enabled: false, price: 0, originalPrice: 0 },
        USDC: { enabled: false, price: 0, originalPrice: 0 },
        USDT: { enabled: false, price: 0, originalPrice: 0 }
      });
    }

    return NextResponse.json(priceDoc.data());

  } catch (error) {
    console.error('Failed to get price overrides:', error);
    return NextResponse.json(
      { error: 'Failed to get price overrides' },
      { status: 500 }
    );
  }
}

// POST - Set price override
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, type, enabled, price, adminAddress, reason } = body;

    if (!token || !type || !adminAddress || enabled === undefined) {
      return NextResponse.json(
        { error: 'Token, type, enabled status, and admin address are required' },
        { status: 400 }
      );
    }

    if (!['onRamp', 'offRamp'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either onRamp or offRamp' },
        { status: 400 }
      );
    }

    if (enabled && (!price || price <= 0)) {
      return NextResponse.json(
        { error: 'Valid price is required when enabling override' },
        { status: 400 }
      );
    }

    const priceDocRef = doc(db, 'systemSettings', 'priceOverrides');
    const timestamp = new Date();

    // Get current overrides
    const currentDoc = await getDoc(priceDocRef);
    const currentOverrides = currentDoc.exists() ? currentDoc.data() : {};

    // Fetch original price from API
    let originalPrice = 0;
    try {
      const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/prices/${token.toLowerCase()}`);
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        originalPrice = priceData.price;
      }
    } catch (error) {
      console.warn('Failed to fetch original price:', error);
    }

    // Initialize token structure if it doesn't exist
    if (!currentOverrides[token.toUpperCase()]) {
      currentOverrides[token.toUpperCase()] = {
        onRamp: { enabled: false, price: 0, originalPrice: 0 },
        offRamp: { enabled: false, price: 0, originalPrice: 0 }
      };
    }

    // Update the specific token and type override
    const updatedOverrides = {
      ...currentOverrides,
      [token.toUpperCase()]: {
        ...currentOverrides[token.toUpperCase()],
        [type]: {
          enabled,
          price: enabled ? price : 0,
          originalPrice,
          lastUpdated: timestamp,
          updatedBy: adminAddress,
          reason: reason || ''
        }
      }
    };

    await setDoc(priceDocRef, updatedOverrides);

    // Log the price override action
    await setDoc(doc(db, 'adminActivities', `price_override_${Date.now()}`), {
      action: enabled ? 'ENABLE_PRICE_OVERRIDE' : 'DISABLE_PRICE_OVERRIDE',
      adminWalletAddress: adminAddress,
      timestamp,
      details: {
        token: token.toUpperCase(),
        type: type.toUpperCase(),
        enabled,
        price: enabled ? price : null,
        originalPrice,
        reason: reason || 'No reason provided'
      },
      targetType: 'PRICE_OVERRIDE'
    });

    return NextResponse.json({
      success: true,
      message: `${type.toUpperCase()} price override ${enabled ? 'enabled' : 'disabled'} for ${token.toUpperCase()}`,
      token: token.toUpperCase(),
      type,
      enabled,
      price: enabled ? price : null,
      originalPrice,
      updatedBy: adminAddress,
      timestamp
    });

  } catch (error) {
    console.error('Failed to set price override:', error);
    return NextResponse.json(
      { error: 'Failed to set price override' },
      { status: 500 }
    );
  }
}

// DELETE - Remove all price overrides
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminAddress = searchParams.get('adminAddress');

    if (!adminAddress) {
      return NextResponse.json(
        { error: 'Admin address is required' },
        { status: 400 }
      );
    }

    const priceDocRef = doc(db, 'systemSettings', 'priceOverrides');
    const timestamp = new Date();

    // Reset all overrides
    const resetOverrides = {
      SUI: { enabled: false, price: 0, originalPrice: 0 },
      USDC: { enabled: false, price: 0, originalPrice: 0 },
      USDT: { enabled: false, price: 0, originalPrice: 0 },
      lastReset: timestamp,
      resetBy: adminAddress
    };

    await setDoc(priceDocRef, resetOverrides);

    // Log the reset action
    await setDoc(doc(db, 'adminActivities', `price_reset_${Date.now()}`), {
      action: 'RESET_ALL_PRICE_OVERRIDES',
      adminWalletAddress: adminAddress,
      timestamp,
      details: {
        message: 'All price overrides have been reset to market prices'
      },
      targetType: 'PRICE_OVERRIDE'
    });

    return NextResponse.json({
      success: true,
      message: 'All price overrides have been reset',
      resetBy: adminAddress,
      timestamp
    });

  } catch (error) {
    console.error('Failed to reset price overrides:', error);
    return NextResponse.json(
      { error: 'Failed to reset price overrides' },
      { status: 500 }
    );
  }
}
