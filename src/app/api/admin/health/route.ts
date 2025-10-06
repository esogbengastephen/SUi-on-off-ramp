import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ADMIN_COLLECTIONS } from '@/lib/firebase-admin';
import { addDoc, collection } from 'firebase-admin/firestore';
import axios from 'axios';

interface HealthCheckResult {
  serviceName: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  responseTime?: number;
  errorMessage?: string;
}

// Check Firebase connection
async function checkFirebaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Try to read from a collection
    const testRef = collection(adminDb, ADMIN_COLLECTIONS.SYSTEM_HEALTH);
    await testRef.limit(1).get();
    
    const responseTime = Date.now() - startTime;
    
    return {
      serviceName: 'firebase',
      status: responseTime < 1000 ? 'HEALTHY' : 'DEGRADED',
      responseTime
    };
  } catch (error) {
    return {
      serviceName: 'firebase',
      status: 'DOWN',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check Paystack API
async function checkPaystackHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      serviceName: 'paystack',
      status: response.status === 200 && responseTime < 2000 ? 'HEALTHY' : 'DEGRADED',
      responseTime
    };
  } catch (error) {
    return {
      serviceName: 'paystack',
      status: 'DOWN',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check CoinGecko API
async function checkCoinGeckoHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/ping', {
      timeout: 10000 // Longer timeout for CoinGecko
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      serviceName: 'coingecko',
      status: response.status === 200 && responseTime < 5000 ? 'HEALTHY' : 'DEGRADED',
      responseTime
    };
  } catch (error) {
    return {
      serviceName: 'coingecko',
      status: 'DOWN',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check Sui Network
async function checkSuiNetworkHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Check Sui testnet RPC endpoint
    const response = await axios.post('https://fullnode.testnet.sui.io:443', {
      jsonrpc: '2.0',
      id: 1,
      method: 'sui_getChainIdentifier',
      params: []
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      serviceName: 'sui-network',
      status: response.status === 200 && responseTime < 2000 ? 'HEALTHY' : 'DEGRADED',
      responseTime
    };
  } catch (error) {
    return {
      serviceName: 'sui-network',
      status: 'DOWN',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Store health check results in Firebase
async function storeHealthCheckResults(results: HealthCheckResult[]) {
  try {
    const healthRef = collection(adminDb, ADMIN_COLLECTIONS.SYSTEM_HEALTH);
    
    // Store each health check result
    for (const result of results) {
      await addDoc(healthRef, {
        ...result,
        createdAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error storing health check results:', error);
  }
}

// Calculate overall system health
function calculateOverallHealth(results: HealthCheckResult[]): {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  summary: string;
  details: HealthCheckResult[];
} {
  const downServices = results.filter(r => r.status === 'DOWN');
  const degradedServices = results.filter(r => r.status === 'DEGRADED');
  
  let status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  let summary: string;
  
  if (downServices.length > 0) {
    status = 'DOWN';
    summary = `${downServices.length} service(s) down: ${downServices.map(s => s.serviceName).join(', ')}`;
  } else if (degradedServices.length > 0) {
    status = 'DEGRADED';
    summary = `${degradedServices.length} service(s) degraded: ${degradedServices.map(s => s.serviceName).join(', ')}`;
  } else {
    status = 'HEALTHY';
    summary = 'All services operational';
  }
  
  return {
    status,
    summary,
    details: results
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('Starting system health check...');
    
    // Run all health checks in parallel
    const healthChecks = await Promise.allSettled([
      checkFirebaseHealth(),
      checkPaystackHealth(),
      checkCoinGeckoHealth(),
      checkSuiNetworkHealth()
    ]);
    
    // Extract results from settled promises
    const results: HealthCheckResult[] = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const serviceNames = ['firebase', 'paystack', 'coingecko', 'sui-network'];
        return {
          serviceName: serviceNames[index],
          status: 'DOWN' as const,
          errorMessage: result.reason?.message || 'Health check failed'
        };
      }
    });
    
    // Calculate overall health
    const overallHealth = calculateOverallHealth(results);
    
    // Store results in Firebase
    await storeHealthCheckResults(results);
    
    console.log('System health check completed:', overallHealth.status);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: overallHealth,
      services: results
    });
    
  } catch (error) {
    console.error('System health check error:', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        overall: {
          status: 'DOWN',
          summary: 'Health check system error',
          details: []
        },
        services: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Manual health check trigger
export async function POST(request: NextRequest) {
  try {
    const { services } = await request.json();
    
    if (!services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Services array is required' },
        { status: 400 }
      );
    }
    
    const healthChecks: Promise<HealthCheckResult>[] = [];
    
    // Run only requested services
    for (const service of services) {
      switch (service) {
        case 'firebase':
          healthChecks.push(checkFirebaseHealth());
          break;
        case 'paystack':
          healthChecks.push(checkPaystackHealth());
          break;
        case 'coingecko':
          healthChecks.push(checkCoinGeckoHealth());
          break;
        case 'sui-network':
          healthChecks.push(checkSuiNetworkHealth());
          break;
        default:
          console.warn(`Unknown service: ${service}`);
      }
    }
    
    const results = await Promise.allSettled(healthChecks);
    const healthResults: HealthCheckResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          serviceName: services[index],
          status: 'DOWN' as const,
          errorMessage: result.reason?.message || 'Health check failed'
        };
      }
    });
    
    const overallHealth = calculateOverallHealth(healthResults);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: overallHealth,
      services: healthResults
    });
    
  } catch (error) {
    console.error('Manual health check error:', error);
    
    return NextResponse.json(
      { error: 'Manual health check failed' },
      { status: 500 }
    );
  }
}
