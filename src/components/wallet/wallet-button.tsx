"use client"

import { ConnectButton, useCurrentWallet, useDisconnectWallet } from '@mysten/dapp-kit'

export function WalletButton() {
  const { currentWallet } = useCurrentWallet()
  const { mutate: disconnect } = useDisconnectWallet()

  if (currentWallet) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Connected: {currentWallet.name}
        </span>
        <button 
          onClick={() => disconnect()}
          className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <ConnectButton 
      connectText="Connect Wallet"
    />
  )
}
