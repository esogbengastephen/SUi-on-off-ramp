"use client"

import { useState } from "react"
import { useCurrentWallet } from "@mysten/dapp-kit"
import { ConnectButton } from "@mysten/dapp-kit"
import ModernAdminDashboard from "@/components/admin/ModernAdminDashboard"
import { useAdminFunctions } from "@/hooks/useSuiContract"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AdminDashboard() {
  // During build time, render a simple placeholder to avoid wallet context issues
  if (process.env.BUILD_TIME === 'true' || process.env.NETLIFY === 'true' || process.env.VERCEL === 'true') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4 opacity-90">Admin Dashboard</h1>
          <p className="text-xl mb-8 opacity-80">
            Admin dashboard will be available at runtime.
          </p>
        </div>
      </div>
    );
  }

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

  // Check if user is admin - using the wallet that deployed the contract
  // You can add multiple admin addresses here
  const adminAddresses = [
    "0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580", // Original admin
    // Add more admin addresses as needed
  ];
  
  const isAdmin = currentWallet?.accounts?.[0]?.address && 
    adminAddresses.includes(currentWallet.accounts[0].address);

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

      {/* Modern Dashboard with all functionality as tabs */}
      <ModernAdminDashboard 
        adminFunctions={{
          confirmOnRampPayment,
          completeOffRamp,
          pauseContract: handlePauseContract,
          unpauseContract: handleUnpauseContract,
          updateExchangeRate: handleUpdateExchangeRate,
          isLoading: adminLoading,
          newExchangeRate,
          setNewExchangeRate
        }}
      />
    </div>
  )
}