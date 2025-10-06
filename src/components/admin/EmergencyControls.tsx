"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useCurrentWallet } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Pause, 
  Play, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Settings,
  Shield,
  Zap,
  Clock,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from "lucide-react";

// Price Override Component
function PriceOverridePanel() {
  const { currentWallet } = useCurrentWallet();
  const { settings } = useSystemSettings();
  
  const [priceOverrides, setPriceOverrides] = useState({
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
  });
  const [overridePriceInput, setOverridePriceInput] = useState<Record<string, Record<string, string>>>({
    SUI: { onRamp: '', offRamp: '' },
    USDC: { onRamp: '', offRamp: '' },
    USDT: { onRamp: '', offRamp: '' }
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Load current price overrides from Firebase
  useEffect(() => {
    if (settings?.priceOverrides) {
      setPriceOverrides({
        SUI: {
          onRamp: settings.priceOverrides.SUI?.onRamp || { enabled: false, price: 0, originalPrice: 0 },
          offRamp: settings.priceOverrides.SUI?.offRamp || { enabled: false, price: 0, originalPrice: 0 }
        },
        USDC: {
          onRamp: settings.priceOverrides.USDC?.onRamp || { enabled: false, price: 0, originalPrice: 0 },
          offRamp: settings.priceOverrides.USDC?.offRamp || { enabled: false, price: 0, originalPrice: 0 }
        },
        USDT: {
          onRamp: settings.priceOverrides.USDT?.onRamp || { enabled: false, price: 0, originalPrice: 0 },
          offRamp: settings.priceOverrides.USDT?.offRamp || { enabled: false, price: 0, originalPrice: 0 }
        }
      });
    }
  }, [settings]);

  const handlePriceOverride = async (token: string, type: 'onRamp' | 'offRamp', enabled: boolean, price?: number) => {
    if (enabled && !price) {
      toast.error('Please enter a valid price');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/admin/prices/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          type,
          enabled,
          price: price || 0,
          adminAddress: currentWallet?.accounts?.[0]?.address,
          reason: enabled ? `Manual ${type.toUpperCase()} price override to ₦${price?.toLocaleString()}` : `${type.toUpperCase()} price override disabled`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update price override');
      }

      const result = await response.json();
      
      // Update local state
      setPriceOverrides(prev => ({
        ...prev,
        [token]: {
          ...prev[token as keyof typeof prev],
          [type]: {
            enabled,
            price: price || 0,
            originalPrice: prev[token as keyof typeof prev][type].originalPrice,
            lastUpdated: new Date(),
            updatedBy: currentWallet?.accounts?.[0]?.address
          }
        }
      }));

      setShowConfirmDialog(null);
      toast.success(result.message);
    } catch (error) {
      toast.error('Failed to update price override');
    } finally {
      setUpdating(false);
    }
  };

  const fetchCurrentPrice = async (token: string) => {
    try {
      const response = await fetch(`/api/prices/${token.toLowerCase()}`);
      const data = await response.json();
      
      setPriceOverrides(prev => ({
        ...prev,
        [token]: {
          ...prev[token as keyof typeof prev],
          onRamp: {
            ...prev[token as keyof typeof prev].onRamp,
            originalPrice: data.price
          },
          offRamp: {
            ...prev[token as keyof typeof prev].offRamp,
            originalPrice: data.price
          }
        }
      }));
      
      toast.success(`Current ${token} price: ₦${data.price.toLocaleString()}`);
    } catch (error) {
      toast.error(`Failed to fetch ${token} price`);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-yellow-400" />
          <span>Manual Price Override</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Override market prices for emergency situations or manual control
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(priceOverrides).map(([token, tokenOverrides]) => (
          <div key={token} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{token}</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{token}</h3>
                  <p className="text-slate-400 text-sm">
                    Market: ₦{tokenOverrides.onRamp.originalPrice?.toLocaleString() || 'Loading...'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchCurrentPrice(token)}
                  className="border-slate-600 text-slate-300"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Market Price
                </Button>
                
                <Badge className={(tokenOverrides.onRamp.enabled || tokenOverrides.offRamp.enabled) ? 
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                  'bg-slate-500/20 text-slate-400 border-slate-500/30'
                }>
                  {(tokenOverrides.onRamp.enabled || tokenOverrides.offRamp.enabled) ? 'Override Active' : 'Market Price'}
                </Badge>
              </div>
            </div>

            {/* ON-RAMP Controls */}
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <h4 className="text-green-400 font-semibold">ON-RAMP (Naira → {token})</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300">Override Price (₦)</Label>
                  <Input
                    type="number"
                    value={overridePriceInput[token]?.onRamp || ''}
                    onChange={(e) => setOverridePriceInput(prev => ({
                      ...prev,
                      [token]: { ...prev[token], onRamp: e.target.value }
                    }))}
                    placeholder="Enter ON-RAMP price"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={tokenOverrides.onRamp.enabled}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      if (tokenOverrides.onRamp.enabled) {
                        handlePriceOverride(token, 'onRamp', false);
                      } else {
                        const price = parseFloat(overridePriceInput[token]?.onRamp || '0');
                        if (price > 0) {
                          handlePriceOverride(token, 'onRamp', true, price);
                        } else {
                          toast.error('Please enter a valid price');
                        }
                      }
                    }}
                    disabled={updating || (!tokenOverrides.onRamp.enabled && !overridePriceInput[token]?.onRamp)}
                    className={tokenOverrides.onRamp.enabled ? 
                      'bg-red-600 hover:bg-red-700 w-full' : 
                      'bg-green-600 hover:bg-green-700 w-full'
                    }
                  >
                    {tokenOverrides.onRamp.enabled ? (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Disable ON-RAMP
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Enable ON-RAMP
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-end">
                  <div className="w-full">
                    <Label className="text-slate-300">Current ON-RAMP Price</Label>
                    <div className="text-green-400 font-bold text-lg">
                      ₦{(tokenOverrides.onRamp.enabled ? tokenOverrides.onRamp.price : tokenOverrides.onRamp.originalPrice)?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* OFF-RAMP Controls */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingDown className="h-4 w-4 text-orange-400" />
                <h4 className="text-orange-400 font-semibold">OFF-RAMP ({token} → Naira)</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300">Override Price (₦)</Label>
                  <Input
                    type="number"
                    value={overridePriceInput[token]?.offRamp || ''}
                    onChange={(e) => setOverridePriceInput(prev => ({
                      ...prev,
                      [token]: { ...prev[token], offRamp: e.target.value }
                    }))}
                    placeholder="Enter OFF-RAMP price"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={tokenOverrides.offRamp.enabled}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      if (tokenOverrides.offRamp.enabled) {
                        handlePriceOverride(token, 'offRamp', false);
                      } else {
                        const price = parseFloat(overridePriceInput[token]?.offRamp || '0');
                        if (price > 0) {
                          handlePriceOverride(token, 'offRamp', true, price);
                        } else {
                          toast.error('Please enter a valid price');
                        }
                      }
                    }}
                    disabled={updating || (!tokenOverrides.offRamp.enabled && !overridePriceInput[token]?.offRamp)}
                    className={tokenOverrides.offRamp.enabled ? 
                      'bg-red-600 hover:bg-red-700 w-full' : 
                      'bg-orange-600 hover:bg-orange-700 w-full'
                    }
                  >
                    {tokenOverrides.offRamp.enabled ? (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Disable OFF-RAMP
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Enable OFF-RAMP
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-end">
                  <div className="w-full">
                    <Label className="text-slate-300">Current OFF-RAMP Price</Label>
                    <div className="text-orange-400 font-bold text-lg">
                      ₦{(tokenOverrides.offRamp.enabled ? tokenOverrides.offRamp.price : tokenOverrides.offRamp.originalPrice)?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {(tokenOverrides.onRamp.enabled || tokenOverrides.offRamp.enabled) && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm">
                  Price overrides are active for {token}. 
                  {tokenOverrides.onRamp.enabled && ` ON-RAMP: ₦${tokenOverrides.onRamp.price?.toLocaleString()}`}
                  {tokenOverrides.onRamp.enabled && tokenOverrides.offRamp.enabled && ','} 
                  {tokenOverrides.offRamp.enabled && ` OFF-RAMP: ₦${tokenOverrides.offRamp.price?.toLocaleString()}`}
                </span>
              </div>
            )}
          </div>
        ))}

      </CardContent>
    </Card>
  );
}

// System Pause Component
function SystemPausePanel() {
  const { currentWallet } = useCurrentWallet();
  const { settings } = useSystemSettings();
  
  const [systemPaused, setSystemPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Load current system status from Firebase
  useEffect(() => {
    if (settings?.systemPaused !== undefined) {
      setSystemPaused(settings.systemPaused);
      setPauseReason(settings.pauseReason || '');
    }
  }, [settings]);

  const handleSystemPause = async (paused: boolean, reason?: string) => {
    if (paused && !reason?.trim()) {
      toast.error('Please provide a reason for pausing the system');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/admin/system/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: paused ? 'pause' : 'resume',
          reason: paused ? reason : undefined,
          adminAddress: currentWallet?.accounts?.[0]?.address
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${paused ? 'pause' : 'resume'} system`);
      }

      const result = await response.json();
      
      setSystemPaused(paused);
      setShowPauseDialog(false);
      setPauseReason(paused ? reason || '' : '');
      
      toast.success(result.message);
    } catch (error) {
      toast.error(`Failed to ${paused ? 'pause' : 'resume'} system`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-400" />
          <span>Emergency System Control</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Pause all transactions and system operations in case of emergency
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${systemPaused ? 'bg-red-400' : 'bg-green-400'} animate-pulse`} />
            <div>
              <h3 className="text-white font-semibold">
                System Status: {systemPaused ? 'PAUSED' : 'OPERATIONAL'}
              </h3>
              <p className="text-slate-400 text-sm">
                {systemPaused ? 'All transactions are blocked' : 'System is running normally'}
              </p>
            </div>
          </div>
          
          <Badge className={systemPaused ? 
            'bg-red-500/20 text-red-400 border-red-500/30' : 
            'bg-green-500/20 text-green-400 border-green-500/30'
          }>
            {systemPaused ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                PAUSED
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                ACTIVE
              </>
            )}
          </Badge>
        </div>

        {/* Pause Reason (if paused) */}
        {systemPaused && pauseReason && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">System Paused</p>
                <p className="text-red-300 text-sm mt-1">{pauseReason}</p>
                <p className="text-slate-400 text-xs mt-2">
                  Paused at: {settings?.pausedAt?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex space-x-4">
          {!systemPaused ? (
            <Button
              onClick={() => setShowPauseDialog(true)}
              disabled={updating}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Pause className="h-4 w-4 mr-2" />
              Emergency Pause System
            </Button>
          ) : (
            <Button
              onClick={() => handleSystemPause(false)}
              disabled={updating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume System Operations
            </Button>
          )}
          
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Pause History
          </Button>
        </div>

        {/* System Impact Warning */}
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Zap className="h-4 w-4 text-orange-400 mt-0.5" />
            <div>
              <p className="text-orange-400 font-medium">System Pause Impact</p>
              <ul className="text-orange-300 text-sm mt-1 space-y-1">
                <li>• All new transactions will be blocked</li>
                <li>• Users will see maintenance message</li>
                <li>• Existing pending transactions will be queued</li>
                <li>• Admin dashboard remains accessible</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pause Dialog */}
        {showPauseDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span>Emergency System Pause</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  This will immediately stop all system operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Reason for Emergency Pause *</Label>
                  <Input
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    placeholder="e.g., Security incident, System maintenance, Market volatility"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">
                    <strong>Warning:</strong> This will immediately pause all transactions and show a maintenance message to users.
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPauseDialog(false)}
                    className="flex-1 border-slate-600 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSystemPause(true, pauseReason)}
                    disabled={!pauseReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Pause System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Emergency Controls Component
export default function EmergencyControls() {
  const { settings } = useSystemSettings();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all emergency control data
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Emergency controls refreshed');
    } catch (error) {
      toast.error('Failed to refresh emergency controls');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Emergency Controls Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Emergency Controls</h2>
          <p className="text-slate-400">Manual price override and system pause controls for emergency situations</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {settings?.systemPaused && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
              <Pause className="h-4 w-4 mr-1" />
              SYSTEM PAUSED
            </Badge>
          )}
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Emergency Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
              settings?.systemPaused ? 'bg-red-500/20' : 'bg-green-500/20'
            }`}>
              {settings?.systemPaused ? 
                <Pause className="h-6 w-6 text-red-400" /> : 
                <Play className="h-6 w-6 text-green-400" />
              }
            </div>
            <p className="text-2xl font-bold text-white">
              {settings?.systemPaused ? 'PAUSED' : 'ACTIVE'}
            </p>
            <p className="text-slate-400 text-sm">System Status</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {Object.values(settings?.priceOverrides || {}).filter((o: any) => o.enabled).length}
            </p>
            <p className="text-slate-400 text-sm">Active Price Overrides</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {settings?.lastModified ? settings.lastModified.toLocaleTimeString() : 'Never'}
            </p>
            <p className="text-slate-400 text-sm">Last Updated</p>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Control Panels */}
      <div className="space-y-8">
        <SystemPausePanel />
        <PriceOverridePanel />
      </div>
    </div>
  );
}
