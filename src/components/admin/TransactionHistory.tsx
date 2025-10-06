"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTransactions, updateTransaction, StoredTransaction } from "@/lib/transaction-storage"
import { toast } from "sonner"

interface TransactionHistoryProps {
  isAdmin: boolean
}

export function TransactionHistory({ isAdmin }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<StoredTransaction | null>(null)
  const [paymentCoinId, setPaymentCoinId] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  // Load transactions from local storage
  const refreshTransactions = () => {
    setIsLoading(true)
    try {
      const storedTransactions = getTransactions()
      setTransactions(storedTransactions)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshTransactions()
  }, [])

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const statusMatch = filterStatus === "all" || tx.status === filterStatus.toUpperCase()
    const typeMatch = filterType === "all" || tx.type === typeMap[filterType]
    return statusMatch && typeMatch
  })

  const typeMap: { [key: string]: string } = {
    "on-ramp": "ON_RAMP",
    "off-ramp": "OFF_RAMP"
  }

  const statusColors: { [key: string]: string } = {
    "PENDING": "bg-yellow-100 text-yellow-800",
    "CONFIRMED": "bg-green-100 text-green-800",
    "COMPLETED": "bg-blue-100 text-blue-800",
    "FAILED": "bg-red-100 text-red-800",
    "CANCELLED": "bg-gray-100 text-gray-800"
  }

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "NAIRA") {
      return `₦${amount.toLocaleString()}`
    }
    return `${amount.toLocaleString()} ${currency}`
  }

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return "N/A"
    return new Date(timestamp).toLocaleString()
  }

  const handleConfirmPayment = async (tx: StoredTransaction) => {
    if (!paymentCoinId) {
      toast.error("Please enter payment coin ID")
      return
    }

    try {
      // Update transaction status
      updateTransaction(tx.id, { status: 'CONFIRMED' })
      toast.success("Payment confirmed successfully")
      setSelectedTransaction(null)
      setPaymentCoinId("")
      refreshTransactions()
    } catch (error) {
      toast.error("Failed to confirm payment")
      console.error("Error confirming payment:", error)
    }
  }

  const handleCompleteOffRamp = async (tx: StoredTransaction) => {
    try {
      // Update transaction status
      updateTransaction(tx.id, { status: 'COMPLETED' })
      toast.success("Off-ramp completed successfully")
      setSelectedTransaction(null)
      refreshTransactions()
    } catch (error) {
      toast.error("Failed to complete off-ramp")
      console.error("Error completing off-ramp:", error)
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Admin access required</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Please connect your admin wallet to view transaction history.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Monitor and manage all swap transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="type-filter">Type</Label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="on-ramp">ON-RAMP</option>
                <option value="off-ramp">OFF-RAMP</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={refreshTransactions} disabled={isLoading}>
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transactions found</p>
            ) : (
              filteredTransactions.map((tx) => (
                <Card key={tx.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={statusColors[tx.status] || "bg-gray-100 text-gray-800"}>
                            {tx.status}
                          </Badge>
                          <Badge variant="outline">
                            {tx.type}
                          </Badge>
                          <span className="text-sm text-gray-500">#{tx.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Amount:</span> {formatAmount(tx.suiAmount, "SUI")}
                          </div>
                          <div>
                            <span className="font-medium">Naira:</span> {formatAmount(tx.nairaAmount, "NAIRA")}
                          </div>
                          <div>
                            <span className="font-medium">User:</span> {tx.userAddress.slice(0, 8)}...{tx.userAddress.slice(-8)}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(tx.createdAt)}
                          </div>
                        </div>
                        {tx.paymentReference && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Reference:</span> {tx.paymentReference}
                          </div>
                        )}
                        {tx.transferStatus && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Transfer Status:</span> 
                            <Badge className="ml-2" variant="outline">{tx.transferStatus}</Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTransaction(tx)}
                        >
                          View Details
                        </Button>
                        {tx.status === "PENDING" && tx.type === "ON_RAMP" && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedTransaction(tx)}
                          >
                            Confirm Payment
                          </Button>
                        )}
                        {tx.status === "CONFIRMED" && tx.type === "OFF_RAMP" && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedTransaction(tx)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Transaction #{selectedTransaction.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge className={statusColors[selectedTransaction.status] || "bg-gray-100 text-gray-800"}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline">{selectedTransaction.type}</Badge>
                </div>
                <div>
                  <Label>SUI Amount</Label>
                  <p>{selectedTransaction.suiAmount.toLocaleString()} SUI</p>
                </div>
                <div>
                  <Label>Naira Amount</Label>
                  <p>₦{selectedTransaction.nairaAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>User Address</Label>
                  <p className="font-mono text-sm">{selectedTransaction.userAddress}</p>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p>{formatDate(selectedTransaction.createdAt)}</p>
                </div>
              </div>

              {selectedTransaction.paymentReference && (
                <div>
                  <Label>Payment Reference</Label>
                  <p className="font-mono text-sm">{selectedTransaction.paymentReference}</p>
                </div>
              )}

              {selectedTransaction.bankAccount && (
                <div>
                  <Label>Bank Account</Label>
                  <p>{selectedTransaction.bankAccount} - {selectedTransaction.bankName}</p>
                </div>
              )}

              {selectedTransaction.paymentSourceAccount && (
                <div>
                  <Label>Payment Source</Label>
                  <p>{selectedTransaction.paymentSourceAccount} - {selectedTransaction.paymentSourceName}</p>
                </div>
              )}

              {selectedTransaction.transferStatus && (
                <div>
                  <Label>Transfer Status</Label>
                  <Badge variant="outline">{selectedTransaction.transferStatus}</Badge>
                </div>
              )}

              {selectedTransaction.verificationData && (
                <div className="border-t pt-4">
                  <Label className="text-lg font-semibold">Amount Verification</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Token Type</Label>
                      <p>{selectedTransaction.verificationData.tokenType}</p>
                    </div>
                    <div>
                      <Label>Token Config</Label>
                      <p>{selectedTransaction.verificationData.tokenConfig?.name || 'N/A'} ({selectedTransaction.verificationData.tokenConfig?.symbol || 'N/A'})</p>
                    </div>
                    <div>
                      <Label>SUI Amount</Label>
                      <p>{selectedTransaction.verificationData.suiAmount?.toFixed(6) || 'N/A'} SUI</p>
                    </div>
                    <div>
                      <Label>Exchange Rate</Label>
                      <p>₦{selectedTransaction.verificationData.exchangeRate.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Requested Token Amount</Label>
                      <p>{selectedTransaction.verificationData.requestedTokenAmount} {selectedTransaction.verificationData.tokenType}</p>
                    </div>
                    <div>
                      <Label>Requested Naira Amount</Label>
                      <p>₦{selectedTransaction.verificationData.requestedNairaAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Calculated Naira Amount</Label>
                      <p>₦{selectedTransaction.verificationData.calculatedNairaAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Amount Verification</Label>
                      <Badge className={selectedTransaction.verificationData.amountMatches ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {selectedTransaction.verificationData.amountMatches ? "✓ MATCHES" : "✗ MISMATCH"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedTransaction.status === "PENDING" && selectedTransaction.type === "ON_RAMP" && (
                  <>
                    <div className="flex-1">
                      <Label htmlFor="payment-coin-id">Payment Coin ID</Label>
                      <Input
                        id="payment-coin-id"
                        value={paymentCoinId}
                        onChange={(e) => setPaymentCoinId(e.target.value)}
                        placeholder="Enter payment coin ID"
                      />
                    </div>
                    <Button onClick={() => handleConfirmPayment(selectedTransaction)}>
                      Confirm Payment
                    </Button>
                  </>
                )}

                {selectedTransaction.status === "CONFIRMED" && selectedTransaction.type === "OFF_RAMP" && (
                  <Button onClick={() => handleCompleteOffRamp(selectedTransaction)}>
                    Complete Off-Ramp
                  </Button>
                )}

                <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
