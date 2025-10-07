"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactionLimits } from "@/hooks/useTransactionLimits";
import { TransactionLimits, TransactionType, TokenType } from "@/lib/transaction-limits-schema";
import { toast } from "sonner";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Coins,
  RefreshCw
} from "lucide-react";

export default function TransactionLimitsManagement() {
  const { 
    limits, 
    loading, 
    error, 
    updateLimits, 
    toggleLimits, 
    resetToDefaults,
    fetchLimits 
  } = useTransactionLimits();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedLimits, setEditedLimits] = useState<TransactionLimits>(limits);
  const [saving, setSaving] = useState(false);

  // Update edited limits when limits change
  useEffect(() => {
    setEditedLimits(limits);
  }, [limits]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLimits(editedLimits, 'admin');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving limits:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedLimits(limits);
    setIsEditing(false);
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all limits to defaults?')) {
      try {
        await resetToDefaults('admin');
        setIsEditing(false);
      } catch (error) {
        console.error('Error resetting limits:', error);
      }
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    try {
      await toggleLimits(isActive, 'admin');
    } catch (error) {
      console.error('Error toggling limits:', error);
    }
  };

  const updateLimit = (path: string, value: number) => {
    setEditedLimits(prev => {
      const newLimits = { ...prev };
      const keys = path.split('.');
      let current: any = newLimits;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newLimits;
    });
  };

  const LimitInput = ({ 
    label, 
    path, 
    value, 
    currency = '', 
    disabled = false 
  }: { 
    label: string; 
    path: string; 
    value: number; 
    currency?: string; 
    disabled?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={path} className="text-slate-300">{label}</Label>
      <div className="relative">
        <Input
          id={path}
          type="number"
          value={value}
          onChange={(e) => updateLimit(path, parseFloat(e.target.value) || 0)}
          disabled={disabled || !isEditing}
          className="bg-slate-700 border-slate-600 text-white"
        />
        {currency && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
            {currency}
          </span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-slate-400">Loading transaction limits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Limits</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={fetchLimits} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Transaction Limits</span>
          </h2>
          <p className="text-slate-400 mt-1">
            Set minimum and maximum limits for on-ramp and off-ramp transactions
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="limits-active" className="text-slate-300">Active</Label>
            <Switch
              id="limits-active"
              checked={limits.isActive}
              onCheckedChange={handleToggleActive}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
          
          {isEditing ? (
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Limits
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-2">
        <Badge 
          variant={limits.isActive ? "default" : "secondary"}
          className={limits.isActive ? "bg-green-500" : "bg-slate-500"}
        >
          {limits.isActive ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Limits Active
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3 mr-1" />
              Limits Disabled
            </>
          )}
        </Badge>
        <span className="text-slate-400 text-sm">
          Last updated: {limits.lastUpdated.toLocaleString()} by {limits.updatedBy}
        </span>
      </div>

      {/* Limits Configuration */}
      <Tabs defaultValue="on-ramp" className="space-y-6">
        <TabsList className="bg-slate-800/50 border-slate-700">
          <TabsTrigger value="on-ramp" className="data-[state=active]:bg-slate-700">
            <DollarSign className="h-4 w-4 mr-2" />
            On-Ramp Limits
          </TabsTrigger>
          <TabsTrigger value="off-ramp" className="data-[state=active]:bg-slate-700">
            <Coins className="h-4 w-4 mr-2" />
            Off-Ramp Limits
          </TabsTrigger>
        </TabsList>

        {/* On-Ramp Limits */}
        <TabsContent value="on-ramp" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">On-Ramp Limits (Naira → Crypto)</CardTitle>
              <CardDescription className="text-slate-400">
                Set minimum and maximum amounts for converting Naira to SUI, USDC, or USDT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">Naira Amounts</h4>
                  <LimitInput
                    label="Minimum Naira Amount"
                    path="onRamp.minNairaAmount"
                    value={editedLimits.onRamp.minNairaAmount}
                    currency="₦"
                  />
                  <LimitInput
                    label="Maximum Naira Amount"
                    path="onRamp.maxNairaAmount"
                    value={editedLimits.onRamp.maxNairaAmount}
                    currency="₦"
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">Crypto Amounts</h4>
                  <LimitInput
                    label="Minimum SUI Amount"
                    path="onRamp.minSuiAmount"
                    value={editedLimits.onRamp.minSuiAmount}
                    currency="SUI"
                  />
                  <LimitInput
                    label="Maximum SUI Amount"
                    path="onRamp.maxSuiAmount"
                    value={editedLimits.onRamp.maxSuiAmount}
                    currency="SUI"
                  />
                  <LimitInput
                    label="Minimum USDC Amount"
                    path="onRamp.minUsdcAmount"
                    value={editedLimits.onRamp.minUsdcAmount}
                    currency="USDC"
                  />
                  <LimitInput
                    label="Maximum USDC Amount"
                    path="onRamp.maxUsdcAmount"
                    value={editedLimits.onRamp.maxUsdcAmount}
                    currency="USDC"
                  />
                  <LimitInput
                    label="Minimum USDT Amount"
                    path="onRamp.minUsdtAmount"
                    value={editedLimits.onRamp.minUsdtAmount}
                    currency="USDT"
                  />
                  <LimitInput
                    label="Maximum USDT Amount"
                    path="onRamp.maxUsdtAmount"
                    value={editedLimits.onRamp.maxUsdtAmount}
                    currency="USDT"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Off-Ramp Limits */}
        <TabsContent value="off-ramp" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Off-Ramp Limits (Crypto → Naira)</CardTitle>
              <CardDescription className="text-slate-400">
                Set minimum and maximum amounts for converting SUI, USDC, or USDT to Naira
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">Naira Amounts</h4>
                  <LimitInput
                    label="Minimum Naira Amount"
                    path="offRamp.minNairaAmount"
                    value={editedLimits.offRamp.minNairaAmount}
                    currency="₦"
                  />
                  <LimitInput
                    label="Maximum Naira Amount"
                    path="offRamp.maxNairaAmount"
                    value={editedLimits.offRamp.maxNairaAmount}
                    currency="₦"
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">Crypto Amounts</h4>
                  <LimitInput
                    label="Minimum SUI Amount"
                    path="offRamp.minSuiAmount"
                    value={editedLimits.offRamp.minSuiAmount}
                    currency="SUI"
                  />
                  <LimitInput
                    label="Maximum SUI Amount"
                    path="offRamp.maxSuiAmount"
                    value={editedLimits.offRamp.maxSuiAmount}
                    currency="SUI"
                  />
                  <LimitInput
                    label="Minimum USDC Amount"
                    path="offRamp.minUsdcAmount"
                    value={editedLimits.offRamp.minUsdcAmount}
                    currency="USDC"
                  />
                  <LimitInput
                    label="Maximum USDC Amount"
                    path="offRamp.maxUsdcAmount"
                    value={editedLimits.offRamp.maxUsdcAmount}
                    currency="USDC"
                  />
                  <LimitInput
                    label="Minimum USDT Amount"
                    path="offRamp.minUsdtAmount"
                    value={editedLimits.offRamp.minUsdtAmount}
                    currency="USDT"
                  />
                  <LimitInput
                    label="Maximum USDT Amount"
                    path="offRamp.maxUsdtAmount"
                    value={editedLimits.offRamp.maxUsdtAmount}
                    currency="USDT"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
