"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import EmailVerificationModal from "@/components/auth/EmailVerificationModal";
import { ArrowLeft, Mail, Lock, Users, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp, validateReferralCode, verifyEmailCode, resendVerificationCode, forgotPassword } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Email verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // Redirect if user is already verified
    if (!loading && user?.isEmailVerified) {
      router.push('/swap');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Track auth page visit
    console.log('📊 Analytics: Auth page visit');
  }, []);

  // Remove local validateReferralCode - now using the one from useFirebaseAuth hook

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📊 Analytics: Login attempt');
      await signIn(loginEmail, loginPassword);
      
      // Check if email is verified
      if (user?.isEmailVerified) {
        toast.success("Login successful!");
        router.push('/swap');
      } else {
        toast.info("Please verify your email first");
        router.push('/verify-email');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupPassword || !confirmPassword || !referralCode) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signupPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📊 Analytics: Signup attempt');
      
      // Validate referral code
      const isValidReferral = await validateReferralCode(referralCode);
      if (!isValidReferral) {
        toast.error("Invalid referral code");
        setIsSubmitting(false);
        return;
      }

      // Create user account with referral data
      await signUp(signupEmail, signupPassword, {
        referralCode: referralCode // This will be used to find the referrer
      });

      console.log('📊 Analytics: Signup successful');
      toast.success("Account created! Please check your email for verification code.");
      
      // Show verification modal instead of redirecting
      console.log('🔍 AUTH: Opening verification modal for email:', signupEmail);
      setVerificationEmail(signupEmail);
      setShowVerificationModal(true);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // If user already exists, try to sign them in and show verification modal
      if (error.message.includes('already exists') || error.message.includes('email-already-in-use')) {
        try {
          console.log('🔍 AUTH: User exists, attempting to sign in...');
          await signIn(signupEmail, signupPassword);
          toast.success("Signed in! Please check your email for verification code.");
          setVerificationEmail(signupEmail);
          setShowVerificationModal(true);
          return;
        } catch (signInError: any) {
          console.error('Sign in error:', signInError);
          toast.error("Account exists but sign in failed. Please try again.");
          return;
        }
      }
      
      toast.error(error.message || "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleVerifyEmail = async (code: string) => {
    console.log('🔍 AUTH: handleVerifyEmail called with code:', code);
    setIsVerifying(true);
    
    try {
      console.log('🔍 AUTH: Calling verifyEmailCode...');
      await verifyEmailCode(code);
      console.log('✅ AUTH: verifyEmailCode completed successfully');
      
      toast.success("Email verified successfully!");
      setShowVerificationModal(false);
      
      console.log('🔍 AUTH: Executing immediate redirect to /swap');
      router.push('/swap');
      
    } catch (error: any) {
      console.log('❌ AUTH: verifyEmailCode failed with error:', error);
      toast.error(error.message || "Invalid verification code. Please try again.");
      throw error; // Re-throw to let modal handle the error
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      await resendVerificationCode();
      toast.success("Verification code sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code. Please try again.");
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsSendingReset(true);
      console.log('🔍 AUTH: Sending password reset email to:', forgotPasswordEmail);
      
      await forgotPassword(forgotPasswordEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error: any) {
      console.log('❌ AUTH: forgotPassword failed with error:', error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsSendingReset(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--switcherfi-background)] flex items-center justify-center">
        <div className="text-center">
          <div className="switcherfi-loading mb-4">
            <div className="w-8 h-8 border-4 border-[var(--switcherfi-primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-[var(--switcherfi-text-secondary)] text-sm">
            <div className="mb-2">Initializing Firebase...</div>
            <div className="w-48 bg-gray-200 rounded-full h-2">
              <div className="bg-[var(--switcherfi-primary)] h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
            <div className="mt-2 text-xs text-gray-500">This may take a few seconds</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--switcherfi-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="mb-6 text-[var(--switcherfi-text-secondary)] hover:text-[var(--switcherfi-primary)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Auth Card */}
        <Card className="switcherfi-card shadow-xl">
          <CardHeader className="text-center pb-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--switcherfi-primary)] to-[var(--switcherfi-button-bg)] rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="switcherfi-heading-lg">Welcome to SwitcherFi</CardTitle>
            <CardDescription className="switcherfi-text-body">
              {activeTab === "login" ? "Sign in to your account" : "Create your account to get started"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="data-[state=active]:bg-[var(--switcherfi-primary)] data-[state=active]:text-white">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-[var(--switcherfi-primary)] data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-[var(--switcherfi-text-primary)]">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--switcherfi-text-secondary)]" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="switcherfi-input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-[var(--switcherfi-text-primary)]">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--switcherfi-text-secondary)]" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="switcherfi-input pl-12 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--switcherfi-text-secondary)] hover:text-[var(--switcherfi-primary)]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-[var(--switcherfi-primary)] hover:text-[var(--switcherfi-primary)]/80 underline"
                    >
                      Forgot your password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="switcherfi-button-primary w-full"
                  >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[var(--switcherfi-text-primary)]">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--switcherfi-text-secondary)]" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="switcherfi-input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-[var(--switcherfi-text-primary)]">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--switcherfi-text-secondary)]" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create a password"
                        className="switcherfi-input pl-12 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--switcherfi-text-secondary)] hover:text-[var(--switcherfi-primary)]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-[var(--switcherfi-text-primary)]">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--switcherfi-text-secondary)]" />
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="switcherfi-input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referral-code" className="text-[var(--switcherfi-text-primary)]">
                      Referral Code <span className="text-[var(--switcherfi-error)]">*</span>
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--switcherfi-text-secondary)]" />
                      <Input
                        id="referral-code"
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder="Enter referral code (e.g., 111806)"
                        className="switcherfi-input pl-12"
                        required
                      />
                    </div>
                    <p className="text-xs text-[var(--switcherfi-text-secondary)]">
                      Referral code is required to create an account
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="switcherfi-button-primary w-full"
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-[var(--switcherfi-text-secondary)]">
            By continuing, you agree to SwitcherFi's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerify={handleVerifyEmail}
        onResend={handleResendEmail}
        email={verificationEmail}
        isVerifying={isVerifying}
      />

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--switcherfi-text-primary)]">
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-[var(--switcherfi-text-secondary)] hover:text-[var(--switcherfi-text-primary)]"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-[var(--switcherfi-text-secondary)] mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="forgot-email" className="text-[var(--switcherfi-text-primary)]">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--switcherfi-text-secondary)]" />
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="switcherfi-input pl-12"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSendingReset}
                  className="flex-1 switcherfi-button-primary"
                >
                  {isSendingReset ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
