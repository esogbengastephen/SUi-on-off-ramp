"use client"

import React from 'react'
import Image from 'next/image'

export type TokenType = 'SUI' | 'USDC' | 'USDT'

interface TokenIconProps {
  token: TokenType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const tokenImages = {
  SUI: '/sui-token.png',
  USDC: '/usdc-token.png', 
  USDT: '/usdt-token.png'
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8'
}

export function TokenIcon({ token, size = 'md', className = '' }: TokenIconProps) {
  const imagePath = tokenImages[token]
  const sizeClass = sizeClasses[size]

  return (
    <div className={`
      ${sizeClass} 
      rounded-full 
      overflow-hidden 
      flex-shrink-0
      ${className}
    `}>
      <Image
        src={imagePath}
        alt={`${token} token logo`}
        width={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
        height={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
        className="w-full h-full object-cover"
        priority
      />
    </div>
  )
}

// Fallback component for when images fail to load
export function TokenIconFallback({ token, size = 'md', className = '' }: TokenIconProps) {
  const sizeClass = sizeClasses[size]
  
  const tokenColors = {
    SUI: 'bg-gradient-to-br from-blue-400 to-blue-600',
    USDC: 'bg-gradient-to-br from-blue-500 to-blue-700',
    USDT: 'bg-gradient-to-br from-green-500 to-green-700'
  }

  const tokenLetters = {
    SUI: 'S',
    USDC: 'U', 
    USDT: 'T'
  }

  return (
    <div className={`
      ${sizeClass}
      ${tokenColors[token]}
      rounded-full
      flex items-center justify-center
      text-white font-bold
      ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}
      ${className}
    `}>
      {tokenLetters[token]}
    </div>
  )
}

// Main component with fallback
export function TokenIconWithFallback({ token, size = 'md', className = '' }: TokenIconProps) {
  const [imageError, setImageError] = React.useState(false)

  if (imageError) {
    return <TokenIconFallback token={token} size={size} className={className} />
  }

  return (
    <div className="relative">
      <Image
        src={tokenImages[token]}
        alt={`${token} token logo`}
        width={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
        height={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
        className={`
          ${sizeClasses[size]}
          rounded-full
          object-cover
          ${className}
        `}
        onError={() => setImageError(true)}
        priority
      />
    </div>
  )
}
