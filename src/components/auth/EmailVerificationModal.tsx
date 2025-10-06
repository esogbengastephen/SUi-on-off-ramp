"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  email: string;
  isVerifying: boolean;
}

export default function EmailVerificationModal({
  isOpen,
  onClose,
  onVerify,
  onResend,
  email,
  isVerifying
}: EmailVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    // Focus first input when modal opens
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handleCodeChange = (index: number, value: string) => {
    console.log('🔍 MODAL: handleCodeChange called with index:', index, 'value:', value);
    
    // Only allow digits
    if (!/^\d*$/.test(value)) {
      console.log('❌ MODAL: Invalid character, only digits allowed');
      return;
    }
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    console.log('🔍 MODAL: Updated code array:', newCode);

    // Auto-focus next input
    if (value && index < 5) {
      console.log('🔍 MODAL: Auto-focusing next input');
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    const isComplete = newCode.every(digit => digit !== "") && newCode.join("").length === 6;
    console.log('🔍 MODAL: Checking if complete:', isComplete, 'joined code:', newCode.join(""));
    
    if (isComplete) {
      console.log('✅ MODAL: All 6 digits entered, calling handleVerifyCode');
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

  const handleVerifyCode = async (code: string) => {
    console.log('🔍 MODAL: handleVerifyCode called with code:', code);
    
    if (code.length !== 6) {
      console.log('❌ MODAL: Code length invalid:', code.length);
      toast.error("Please enter a 6-digit code");
      return;
    }

    console.log('✅ MODAL: Code length valid, calling onVerify...');
    try {
      await onVerify(code);
      console.log('✅ MODAL: onVerify completed successfully');
    } catch (error: any) {
      console.log('❌ MODAL: onVerify failed with error:', error);
      
      // Show specific error message
      if (error.message.includes('Incorrect verification code')) {
        toast.error("Incorrect verification code. Please try again.");
      } else {
        toast.error(error.message || "Invalid verification code. Please try again.");
      }
      
      // Reset code on error
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      await onResend();
      
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

  if (!isOpen) return null;

  console.log('🔍 MODAL: EmailVerificationModal rendering with isOpen:', isOpen, 'email:', email);
  console.log('🔍 MODAL: verificationCode state:', verificationCode);
  console.log('🔍 MODAL: isVerifying state:', isVerifying);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{zIndex: 9999}}>
      <Card className="switcherfi-card shadow-2xl w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center pb-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[var(--switcherfi-text-secondary)] hover:text-[var(--switcherfi-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--switcherfi-primary)] to-[var(--switcherfi-button-bg)] rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <CardTitle className="switcherfi-heading-lg">Verify Your Email</CardTitle>
          <CardDescription className="switcherfi-text-body">
            We've sent a 6-digit verification code to<br />
            <span className="font-medium text-[var(--switcherfi-primary)]">{email}</span>
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

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-[var(--switcherfi-text-secondary)]">
              Check your spam folder if you don't see the email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
