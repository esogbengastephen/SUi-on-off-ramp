"use client"

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'

// Create a client
const queryClient = new QueryClient()

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
})

// Wallet provider component
interface WalletProviderProps {
  children: ReactNode
}

export function SuiWalletProvider({ children }: WalletProviderProps) {
  // During build time, render children without wallet providers to avoid SSR issues
  if (process.env.BUILD_TIME === 'true' || process.env.NETLIFY === 'true' || process.env.VERCEL === 'true') {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
