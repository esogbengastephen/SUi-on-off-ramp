"use client"

import { useEffect, useState } from 'react'

export default function WalletDebugPage() {
  const [walletInfo, setWalletInfo] = useState<any>({})
  const [connectionAttempts, setConnectionAttempts] = useState<string[]>([])

  useEffect(() => {
    const checkWallets = () => {
      const info: any = {}
      
      if (typeof window !== 'undefined') {
        // Check for Sui Wallet
        if ((window as any).suiWallet) {
          info.suiWallet = {
            exists: true,
            methods: Object.keys((window as any).suiWallet),
            connect: typeof (window as any).suiWallet.connect === 'function',
            version: (window as any).suiWallet.version || 'unknown'
          }
        } else {
          info.suiWallet = { exists: false }
        }
        
        // Check for Suiet
        if ((window as any).suiet) {
          info.suiet = {
            exists: true,
            methods: Object.keys((window as any).suiet),
            connect: typeof (window as any).suiet.connect === 'function',
            version: (window as any).suiet.version || 'unknown'
          }
        } else {
          info.suiet = { exists: false }
        }
        
        // Check for Suiet Wallet (alternative)
        if ((window as any).__suiet) {
          info.__suiet = {
            exists: true,
            methods: Object.keys((window as any).__suiet),
            connect: typeof (window as any).__suiet.connect === 'function',
            version: (window as any).__suiet.version || 'unknown'
          }
        } else {
          info.__suiet = { exists: false }
        }
        
        // Check for generic sui
        if ((window as any).sui) {
          info.sui = {
            exists: true,
            methods: Object.keys((window as any).sui),
            connect: typeof (window as any).sui.connect === 'function',
            version: (window as any).sui.version || 'unknown'
          }
        } else {
          info.sui = { exists: false }
        }
      }
      
      setWalletInfo(info)
      console.log('Wallet debug info:', info)
    }
    
    checkWallets()
    
    // Check again after a delay
    const timeoutId = setTimeout(checkWallets, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [])

  const attemptConnection = async (walletType: string) => {
    const attempts = [...connectionAttempts]
    attempts.push(`Attempting connection to ${walletType}...`)
    setConnectionAttempts(attempts)
    
    try {
      let result
      if (walletType === 'suiWallet' && (window as any).suiWallet) {
        result = await (window as any).suiWallet.connect()
      } else if (walletType === 'suiet' && (window as any).suiet) {
        result = await (window as any).suiet.connect()
      } else if (walletType === '__suiet' && (window as any).__suiet) {
        result = await (window as any).__suiet.connect()
      } else if (walletType === 'sui' && (window as any).sui) {
        result = await (window as any).sui.connect()
      } else {
        throw new Error(`${walletType} not found`)
      }
      
      attempts.push(`✅ ${walletType} connected successfully:`, result)
      setConnectionAttempts(attempts)
    } catch (error) {
      attempts.push(`❌ ${walletType} connection failed:`, error.message)
      setConnectionAttempts(attempts)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          Wallet Debug Page
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Wallet Detection Results
          </h2>
          
          <div className="space-y-4">
            {Object.entries(walletInfo).map(([walletName, info]: [string, any]) => (
              <div key={walletName} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                  {walletName}
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Exists:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      info.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {info.exists ? '✅ Yes' : '❌ No'}
                    </span>
                  </p>
                  {info.exists && (
                    <>
                      <p><span className="font-medium">Methods:</span> {info.methods?.join(', ') || 'None'}</p>
                      <p><span className="font-medium">Has connect():</span> {info.connect ? '✅ Yes' : '❌ No'}</p>
                      <p><span className="font-medium">Version:</span> {info.version}</p>
                      <button
                        onClick={() => attemptConnection(walletName)}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Try Connect
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Connection Attempts
          </h2>
          <div className="space-y-2 text-sm font-mono bg-gray-100 dark:bg-gray-700 p-4 rounded">
            {connectionAttempts.length === 0 ? (
              <p className="text-gray-500">No connection attempts yet</p>
            ) : (
              connectionAttempts.map((attempt, index) => (
                <div key={index} className="text-gray-800 dark:text-gray-200">
                  {attempt}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Instructions
          </h2>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>1. <strong>Check Detection:</strong> Look at the "Wallet Detection Results" above to see which wallets are detected</p>
            <p>2. <strong>Try Connection:</strong> Click "Try Connect" for any detected wallet</p>
            <p>3. <strong>Check Console:</strong> Open browser console (F12) to see detailed logs</p>
            <p>4. <strong>Refresh:</strong> If no wallets are detected, try refreshing the page</p>
            <p>5. <strong>Check Extensions:</strong> Make sure wallet extensions are enabled and not in incognito mode</p>
          </div>
        </div>
      </div>
    </div>
  )
}
