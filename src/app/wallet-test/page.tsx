"use client"

import { ConnectButton, useCurrentWallet, useDisconnectWallet } from '@mysten/dapp-kit'
import { Button } from "@/components/ui/button"

export default function WalletTestPage() {
  const { currentWallet } = useCurrentWallet()
  const { mutate: disconnect } = useDisconnectWallet()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Wallet Test Page</h1>
          <ConnectButton connectText="Connect Wallet" />
        </header>

        <main className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Wallet Status</h2>
            
            {currentWallet ? (
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 font-medium">✅ Wallet Connected!</p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    Wallet: {currentWallet.name}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Wallet Details:</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p><strong>Name:</strong> {currentWallet.name}</p>
                    <p><strong>Version:</strong> {currentWallet.version}</p>
                    <p><strong>Icon:</strong> {currentWallet.icon}</p>
                    <p><strong>Accounts:</strong> {currentWallet.accounts?.length || 0}</p>
                  </div>
                </div>

                <Button 
                  onClick={() => disconnect()}
                  variant="outline"
                  className="w-full"
                >
                  Disconnect Wallet
                </Button>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">⚠️ No Wallet Connected</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                  Click "Connect Wallet" above to connect your Sui wallet
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Supported Wallets:</h3>
              <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                <li>• Sui Wallet (Browser Extension)</li>
                <li>• Suiet Wallet</li>
                <li>• Sui Wallet Mobile</li>
                <li>• Other Sui-compatible wallets</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Troubleshooting:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Make sure you have a Sui wallet installed</li>
                <li>• Ensure your wallet is unlocked</li>
                <li>• Try refreshing the page</li>
                <li>• Check if your wallet supports testnet</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}