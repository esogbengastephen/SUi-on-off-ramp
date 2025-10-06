"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { ArrowRight, Zap, Shield, Globe } from "lucide-react";

export default function SwitcherFiLanding() {
  const router = useRouter();
  const { user, loading } = useFirebaseAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setIsVisible(true);
    
    // Track landing page visit
    if (typeof window !== 'undefined') {
      console.log('📊 Analytics: Landing page visit');
      // TODO: Add actual analytics tracking
    }
  }, []);

  useEffect(() => {
    // Redirect verified users directly to swap
    if (!loading && user?.isEmailVerified) {
      router.push('/swap');
    }
  }, [user, loading, router]);

  const handleGetStarted = () => {
    // Track get started click
    console.log('📊 Analytics: Get Started clicked');
    
    if (user && user.isEmailVerified) {
      router.push('/swap');
    } else {
      router.push('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--switcherfi-background)] flex items-center justify-center">
        <div className="switcherfi-loading">
          <div className="w-8 h-8 border-4 border-[var(--switcherfi-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--switcherfi-background)]">
      {/* Hero Section */}
      <div className={`container mx-auto px-4 py-16 transition-all duration-700 ${isVisible ? 'switcherfi-fade-in' : 'opacity-0'}`}>
        <div className="text-center space-y-8 mb-16 max-w-4xl mx-auto">
          {/* Logo Placeholder */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--switcherfi-primary)] to-[var(--switcherfi-button-bg)] rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="switcherfi-heading-xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-[var(--switcherfi-primary)] to-[var(--switcherfi-button-bg)] bg-clip-text text-transparent">
              SwitcherFi
            </span>
          </h1>

          {/* Subtitle */}
          <p className="switcherfi-text-body max-w-2xl mx-auto leading-relaxed">
            Your gateway to seamless crypto-to-fiat swaps. Trade SUI, USDC, and USDT for Naira with ease, security, and lightning-fast transactions.
          </p>

          {/* Get Started Button */}
          <div className="pt-8">
            <Button 
              onClick={handleGetStarted}
              className="switcherfi-button-primary text-lg px-8 py-4 group transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="switcherfi-card p-6 text-center group hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--switcherfi-primary)] to-[var(--switcherfi-button-bg)] rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--switcherfi-text-primary)] mb-2">
              Lightning Fast
            </h3>
            <p className="switcherfi-text-body text-sm">
              Execute swaps in seconds with our optimized blockchain infrastructure
            </p>
          </div>

          <div className="switcherfi-card p-6 text-center group hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--switcherfi-primary)] to-[var(--switcherfi-button-bg)] rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--switcherfi-text-primary)] mb-2">
              Bank-Grade Security
            </h3>
            <p className="switcherfi-text-body text-sm">
              Your funds are protected with enterprise-level security protocols
            </p>
          </div>

          <div className="switcherfi-card p-6 text-center group hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--switcherfi-primary)] to-[var(--switcherfi-button-bg)] rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--switcherfi-text-primary)] mb-2">
              Global Access
            </h3>
            <p className="switcherfi-text-body text-sm">
              Trade from anywhere with support for multiple cryptocurrencies
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-[var(--switcherfi-border)]">
          <p className="text-sm text-[var(--switcherfi-text-secondary)]">
            © 2025 SwitcherFi. Secure. Fast. Reliable.
          </p>
        </div>
      </div>
    </div>
  );
}