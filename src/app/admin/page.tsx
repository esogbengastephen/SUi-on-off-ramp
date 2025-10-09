"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentWallet } from "@mysten/dapp-kit"
import { ConnectButton } from "@mysten/dapp-kit"
import EnhancedAdminDashboard from "@/components/admin/EnhancedAdminDashboard"
import FirebaseAdminDashboard from "@/components/admin/FirebaseAdminDashboard"
import { TransactionHistory } from "@/components/admin/TransactionHistory"
import TreasuryManagement from "@/components/admin/TreasuryManagement"
import ModernAdminDashboard from "@/components/admin/ModernAdminDashboard"
import { useAdminFunctions } from "@/hooks/useSuiContract"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AdminDashboard() {
  const { currentWallet } = useCurrentWallet()
  const {
    confirmOnRampPayment,
    completeOffRamp,
    pauseContract,
    unpauseContract,
    updateExchangeRate,
    isLoading: adminLoading,
  } = useAdminFunctions()

  // State for admin actions
  const [newExchangeRate, setNewExchangeRate] = useState("")
  const [selectedTab, setSelectedTab] = useState("modern")

  // Check if user is admin - using the wallet that deployed the contract
  const isAdmin = currentWallet?.accounts?.[0]?.address === "0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580"

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center space-y-6">
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this dashboard. Please connect with an admin wallet.
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  const handleUpdateExchangeRate = async () => {
    if (!newExchangeRate) {
      toast.error("Please enter a new exchange rate")
      return
    }

    try {
      await updateExchangeRate(
        process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || "",
        parseInt(newExchangeRate),
        process.env.NEXT_PUBLIC_ADMIN_CAP_ID || ""
      )
      setNewExchangeRate("")
      toast.success("Exchange rate updated successfully")
    } catch (error) {
      console.error("Error updating exchange rate:", error)
      toast.error("Failed to update exchange rate")
    }
  }

  const handlePauseContract = async () => {
    try {
      await pauseContract(
        process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || "",
        process.env.NEXT_PUBLIC_ADMIN_CAP_ID || ""
      )
      toast.success("Contract paused successfully")
    } catch (error) {
      console.error("Error pausing contract:", error)
      toast.error("Failed to pause contract")
    }
  }

  const handleUnpauseContract = async () => {
    try {
      await unpauseContract(
        process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || "",
        process.env.NEXT_PUBLIC_ADMIN_CAP_ID || ""
      )
      toast.success("Contract unpaused successfully")
    } catch (error) {
      console.error("Error unpausing contract:", error)
      toast.error("Failed to unpause contract")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage transactions, monitor system health, and control smart contract operations
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Connected: {currentWallet?.accounts?.[0]?.address}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Admin</Badge>
            <ConnectButton connectText="Switch Wallet" />
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="modern">Modern Dashboard</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced Dashboard</TabsTrigger>
          <TabsTrigger value="firebase">Firebase Dashboard</TabsTrigger>
          <TabsTrigger value="legacy">Legacy Dashboard</TabsTrigger>
          <TabsTrigger value="treasury">Treasury Management</TabsTrigger>
          <TabsTrigger value="contract">Contract Management</TabsTrigger>
        </TabsList>

        <TabsContent value="modern" className="space-y-6">
          <ModernAdminDashboard />
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedAdminDashboard />
        </TabsContent>

        <TabsContent value="firebase" className="space-y-6">
          <FirebaseAdminDashboard />
        </TabsContent>

        <TabsContent value="legacy" className="space-y-6">
          <TransactionHistory isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="treasury" className="space-y-6">
          <TreasuryManagement />
        </TabsContent>

        <TabsContent value="contract" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Control</CardTitle>
                <CardDescription>Pause or unpause the swap contract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handlePauseContract}
                  disabled={adminLoading}
                  variant="destructive"
                >
                  Pause Contract
                </Button>
                <Button
                  onClick={handleUnpauseContract}
                  disabled={adminLoading}
                  variant="default"
                >
                  Unpause Contract
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exchange Rate</CardTitle>
                <CardDescription>Update the SUI to Naira exchange rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="exchange-rate">New Exchange Rate (NGN per SUI)</Label>
                  <Input
                    id="exchange-rate"
                    type="number"
                    placeholder="e.g., 3000"
                    value={newExchangeRate}
                    onChange={(e) => setNewExchangeRate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUpdateExchangeRate}
                  disabled={adminLoading || !newExchangeRate}
                >
                  Update Rate
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Current system parameters and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Contract ID</Label>
                  <Input value={process.env.NEXT_PUBLIC_SWAP_CONTRACT_ID || ""} readOnly />
                </div>
                <div>
                  <Label>Treasury ID</Label>
                  <Input value={process.env.NEXT_PUBLIC_TREASURY_ID || ""} readOnly />
                </div>
                <div>
                  <Label>Admin Cap ID</Label>
                  <Input value={process.env.NEXT_PUBLIC_ADMIN_CAP_ID || ""} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}