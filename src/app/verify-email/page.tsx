"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading, verifyEmailCode, resendVerificationCode } = useFirebaseAuth();
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Redirect if user is already verified
    if (!loading && user?.isEmailVerified) {
      router.push('/swap');
    }
    
    // Redirect if no user
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Start resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newCode.every(digit => digit !== "") && newCode.join("").length === 6) {
      handleVerifyCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);
    
    if (digits.length === 6) {
      const newCode = digits.split("");
      setVerificationCode(newCode);
      handleVerifyCode(digits);
    }
  };

  // Helper functions moved to useFirebaseAuth hook

  const handleVerifyCode = async (code: string) => {
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);

    try {
      console.log('📊 Analytics: Email verification attempt');
      
      // Use the enhanced Firebase auth hook for verification
      await verifyEmailCode(code);
      
      console.log('📊 Analytics: Email verification successful');
      toast.success("Email verified successfully!");
      
      // Redirect to swap page
      router.push('/swap');
      
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || "Invalid verification code. Please try again.");
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || !user?.email) return;

    try {
      // Use the enhanced Firebase auth hook for resending
      await resendVerificationCode();
      
      toast.success("Verification code sent!");
      
      // Reset cooldown
      setCanResend(false);
      setResendCooldown(60);
      
      // Clear current code
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code. Please try again.");
    }
  };

  const handleBackToAuth = () => {
    router.push('/auth');
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

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[var(--switcherfi-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBackToAuth}
          className="mb-6 text-[var(--switcherfi-text-secondary)] hover:text-[var(--switcherfi-primary)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        {/* Verification Card */}
        <Card className="switcherfi-card shadow-xl">
          <CardHeader className="text-center pb-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--switcherfi-primary)] to-[var(--switcherfi-button-bg)] rounded-2xl flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <CardTitle className="switcherfi-heading-lg">Verify Your Email</CardTitle>
            <CardDescription className="switcherfi-text-body">
              We've sent a 6-digit verification code to<br />
              <span className="font-medium text-[var(--switcherfi-primary)]">{user.email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Code Input */}
            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                {verificationCode.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-lg font-semibold switcherfi-input"
                    disabled={isVerifying}
                  />
                ))}
              </div>
              
              <p className="text-xs text-center text-[var(--switcherfi-text-secondary)]">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Verify Button */}
            <Button
              onClick={() => handleVerifyCode(verificationCode.join(""))}
              disabled={verificationCode.some(digit => digit === "") || isVerifying}
              className="switcherfi-button-primary w-full"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Email
                </>
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm text-[var(--switcherfi-text-secondary)] mb-2">
                Didn't receive the code?
              </p>
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={!canResend}
                className="text-[var(--switcherfi-primary)] hover:text-[var(--switcherfi-primary-dark)] disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {canResend ? "Resend Code" : `Resend in ${resendCooldown}s`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-xs text-[var(--switcherfi-text-secondary)]">
            Check your spam folder if you don't see the email
          </p>
        </div>
      </div>
    </div>
  );
}
