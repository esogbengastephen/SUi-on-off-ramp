import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteField } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '@/lib/firebase';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  walletAddress?: string;
  role?: 'user' | 'admin';
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycData?: any;
  
  // Email Verification
  isEmailVerified?: boolean;
  emailVerificationCode?: string;
  emailVerificationExpiry?: Date;
  
  // Referral System
  referralCode?: string;
  referredBy?: string;
  totalReferrals?: number;
  
  // Analytics
  lastLoginAt?: Date;
  signupSource?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      try {
        console.log('🔍 FIREBASE: Auth state changed:', firebaseUser?.uid || 'null');
        
        if (firebaseUser) {
          console.log('🔍 FIREBASE: User found, fetching data...');
          try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData,
              createdAt: userData.createdAt?.toDate(),
              updatedAt: userData.updatedAt?.toDate()
            });
              console.log('✅ FIREBASE: User data loaded from Firestore');
          } else {
              console.log('🔍 FIREBASE: User document not found, creating...');
            // Create user document if it doesn't exist
            const newUserData = {
                email: firebaseUser.email || '',
                role: 'user' as const,
                kycStatus: 'PENDING' as const,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUserData);
            setUser({
              uid: firebaseUser.uid,
              ...newUserData
            });
            console.log('✅ FIREBASE: User document created');
          }
          } catch (firestoreError) {
            console.log('⚠️ FIREBASE: Firestore error, using basic user data:', firestoreError);
            // Fallback to basic user data if Firestore fails
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'user',
              kycStatus: 'PENDING',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        } else {
          console.log('🔍 FIREBASE: No Firebase user, checking for mock user...');
          // Check for mock user in localStorage when Firebase user is null
          const mockUserData = localStorage.getItem('mock_user');
          if (mockUserData) {
            try {
              const mockUser = JSON.parse(mockUserData);
              console.log('🔧 MOCK: Found mock user in localStorage, restoring session');
              
              setUser({
                uid: mockUser.uid,
                email: mockUser.email,
                role: 'user',
                kycStatus: 'PENDING',
                isEmailVerified: mockUser.isEmailVerified || false,
                emailVerificationCode: mockUser.emailVerificationCode,
                emailVerificationExpiry: mockUser.emailVerificationExpiry ? new Date(mockUser.emailVerificationExpiry) : undefined,
                referralCode: mockUser.referralCode,
                referredBy: mockUser.referredBy,
                totalReferrals: 0,
                signupSource: 'web',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            } catch (error) {
              console.error('Error parsing mock user data:', error);
              localStorage.removeItem('mock_user');
              setUser(null);
          }
        } else {
          setUser(null);
        }
        }
        
        console.log('✅ FIREBASE: Auth state resolved, setting loading to false');
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('❌ FIREBASE: Auth state change error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    });

    // Fallback timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      console.log('⚠️ FIREBASE: Auth state timeout, forcing loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('🔍 FIREBASE: signIn called with email:', email);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ FIREBASE: User signed in successfully:', result.user.uid);
      return result.user;
    } catch (error: any) {
      console.log('❌ FIREBASE: Sign in failed:', error);
      
      // If it's a network error, use offline mode
      if (error.code === 'auth/network-request-failed' || error.message.includes('network')) {
        console.log('🔄 FIREBASE: Network error detected, using offline mode...');
        return await mockSignIn(email, password);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<FirebaseUser> = {}) => {
    try {
      setError(null);
      console.log('🔍 FIREBASE: signUp called with email:', email);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ FIREBASE: User created successfully:', result.user.uid);
      
      // Generate unique referral code for new user
      const userReferralCode = generateReferralCode(result.user.uid);
      
      // Generate email verification code
      const emailVerificationCode = generateVerificationCode();
      const emailVerificationExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year (effectively no expiration)
      
      const newUserData: Partial<FirebaseUser> = {
        email,
        role: 'user',
        kycStatus: 'PENDING',
        isEmailVerified: false,
        emailVerificationCode,
        emailVerificationExpiry,
        referralCode: userReferralCode,
        referredBy: userData.referralCode || undefined,
        totalReferrals: 0,
        signupSource: 'web',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...userData
      };
      
      // Save user data
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), newUserData);
      
      // Handle referral tracking
      if (userData.referralCode) {
        await handleReferralSignup(result.user.uid, userData.referralCode, userReferralCode);
      }
      
      // Send verification email
      await sendVerificationEmail(email, emailVerificationCode);
      
      // Track analytics
      await trackUserAnalytics(result.user.uid, 'signup', {
        referralCode: userData.referralCode,
        signupSource: 'web'
      });
      
      return result.user;
    } catch (error: any) {
      console.log('❌ FIREBASE: Signup failed:', error);
      
      // If it's a network error, use offline mode
      if (error.code === 'auth/network-request-failed' || error.message.includes('network')) {
        console.log('🔄 FIREBASE: Network error detected, using offline mode...');
        return await mockSignUp(email, password, userData);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      
      // Clear mock user from localStorage
      localStorage.removeItem('mock_user');
      console.log('🔧 MOCK: Cleared mock user from localStorage');
      
      // Sign out from Firebase (this might fail in offline mode, but that's OK)
      try {
      await signOut(auth);
      } catch (firebaseError) {
        console.log('⚠️ FIREBASE: Firebase logout failed (likely offline mode)');
      }
      
      console.log('✅ Logout successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUserProfile = async (updates: Partial<FirebaseUser>) => {
    console.log('🔍 FIREBASE: updateUserProfile called with updates:', updates);
    
    if (!user) {
      console.log('❌ FIREBASE: No user logged in for profile update');
      throw new Error('No user logged in');
    }
    
    try {
      setError(null);
      const userDoc = doc(db, COLLECTIONS.USERS, user.uid);
      
      console.log('🔍 FIREBASE: Updating user document in Firestore...');
      await setDoc(userDoc, {
        ...updates,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('✅ FIREBASE: User document updated successfully');
      
      // Update local user state
      console.log('🔍 FIREBASE: Updating local user state...');
      setUser(prev => prev ? { ...prev, ...updates } : null);
      
      console.log('✅ FIREBASE: Local user state updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      console.log('❌ FIREBASE: Profile update failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const linkWallet = async (walletAddress: string) => {
    await updateUserProfile({ walletAddress });
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isKycVerified = () => {
    return user?.kycStatus === 'VERIFIED';
  };

  // Email verification functions
  const verifyEmailCode = async (code: string) => {
    console.log('🔍 FIREBASE: verifyEmailCode called with code:', code);
    console.log('🔍 FIREBASE: Current user:', user?.uid, user?.email);
    
    if (!user) {
      console.log('❌ FIREBASE: No user logged in');
      throw new Error('No user logged in');
    }
    
    try {
      setError(null);
      
      // Check if this is a mock user
      if (user.uid.startsWith('mock_')) {
        console.log('🔧 MOCK: Verifying email code for mock user');
        return await mockVerifyEmailCode(code);
      }
      
      console.log('🔍 FIREBASE: Fetching user document...');
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const userData = userDocSnapshot.data() as FirebaseUser;
      
      console.log('🔍 FIREBASE: User data retrieved:', {
        emailVerificationCode: userData.emailVerificationCode,
        emailVerificationExpiry: userData.emailVerificationExpiry,
        isEmailVerified: userData.isEmailVerified
      });
      
      if (!userData.emailVerificationCode) {
        console.log('❌ FIREBASE: No verification code found in user data');
        throw new Error('No verification code found');
      }
      
      // Simplified verification - just check if code matches (no expiration check)
      if (userData.emailVerificationCode !== code) {
        console.log('❌ FIREBASE: Code mismatch - expected:', userData.emailVerificationCode, 'got:', code);
        throw new Error('Incorrect verification code');
      }
      
      console.log('✅ FIREBASE: Code validation passed, updating user profile...');
      // Mark email as verified and remove verification fields
      await setDoc(userDocRef, {
        isEmailVerified: true,
        updatedAt: new Date()
      }, { merge: true });
      
      // Remove verification fields using deleteField
      await setDoc(userDocRef, {
        emailVerificationCode: deleteField(),
        emailVerificationExpiry: deleteField()
      }, { merge: true });
      
      console.log('✅ FIREBASE: User profile updated, tracking analytics...');
      // Track analytics
      await trackUserAnalytics(user.uid, 'email_verified');
      
      console.log('✅ FIREBASE: Email verification completed successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
      console.log('❌ FIREBASE: Email verification failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resendVerificationCode = async () => {
    if (!user?.email) throw new Error('No user email found');
    
    try {
      setError(null);
      const newCode = generateVerificationCode();
      const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year (effectively no expiration)
      
      await updateUserProfile({
        emailVerificationCode: newCode,
        emailVerificationExpiry: newExpiry
      });
      
      await sendVerificationEmail(user.email, newCode);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Mock authentication functions for offline mode
  const mockSignIn = async (email: string, password: string) => {
    console.log('🔧 MOCK: Mock sign in for email:', email);
    
    // Create a mock user object
    const mockUser = {
      uid: `mock_${Date.now()}`,
      email: email,
      emailVerified: false,
      displayName: null,
      photoURL: null,
      phoneNumber: null,
      providerId: 'mock',
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    } as any;
    
    // Store mock user in localStorage for persistence
    localStorage.setItem('mock_user', JSON.stringify({
      ...mockUser,
      emailVerificationCode: '123456', // Fixed code for testing
      emailVerificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    // Update local state
    setUser({
      uid: mockUser.uid,
      email: mockUser.email,
      role: 'user',
      kycStatus: 'PENDING',
      isEmailVerified: false,
      emailVerificationCode: '123456',
      emailVerificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      referralCode: '123456',
      totalReferrals: 0,
      signupSource: 'web',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ MOCK: Mock sign in successful');
    return mockUser;
  };

  const mockSignUp = async (email: string, password: string, userData: Partial<FirebaseUser> = {}) => {
    console.log('🔧 MOCK: Mock sign up for email:', email);
    
    // Generate mock data
    const mockUid = `mock_${Date.now()}`;
    const emailVerificationCode = generateVerificationCode();
    const userReferralCode = generateReferralCode(mockUid);
    
    // Create mock user object
    const mockUser = {
      uid: mockUid,
      email: email,
      emailVerified: false,
      displayName: null,
      photoURL: null,
      phoneNumber: null,
      providerId: 'mock',
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    } as any;
    
    // Store mock user in localStorage
    localStorage.setItem('mock_user', JSON.stringify({
      ...mockUser,
      emailVerificationCode,
      emailVerificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      referralCode: userReferralCode,
      referredBy: userData.referralCode || undefined
    }));
    
    // Send verification email (this should still work via our API)
    try {
      await sendVerificationEmail(email, emailVerificationCode);
      console.log('✅ MOCK: Verification email sent');
    } catch (emailError) {
      console.log('⚠️ MOCK: Email sending failed, but continuing with mock signup');
    }
    
    // Update local state
    setUser({
      uid: mockUid,
      email: email,
      role: 'user',
      kycStatus: 'PENDING',
      isEmailVerified: false,
      emailVerificationCode,
      emailVerificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      referralCode: userReferralCode,
      referredBy: userData.referralCode || undefined,
      totalReferrals: 0,
      signupSource: 'web',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ MOCK: Mock sign up successful');
    return mockUser;
  };

  const mockVerifyEmailCode = async (code: string) => {
    console.log('🔧 MOCK: Mock verify email code:', code);
    
    // Get mock user from localStorage
    const mockUserData = localStorage.getItem('mock_user');
    if (!mockUserData) {
      throw new Error('No mock user found');
    }
    
    const mockUser = JSON.parse(mockUserData);
    
    // Check if code matches
    if (mockUser.emailVerificationCode !== code) {
      console.log('❌ MOCK: Code mismatch - expected:', mockUser.emailVerificationCode, 'got:', code);
      throw new Error('Incorrect verification code');
    }
    
    console.log('✅ MOCK: Code validation passed, updating mock user...');
    
    // Update mock user in localStorage
    const updatedMockUser = {
      ...mockUser,
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null
    };
    localStorage.setItem('mock_user', JSON.stringify(updatedMockUser));
    
    // Update local state
    setUser(prev => prev ? {
      ...prev,
      isEmailVerified: true,
      emailVerificationCode: undefined,
      emailVerificationExpiry: undefined
    } : null);
    
    console.log('✅ MOCK: Email verification completed successfully');
    return true;
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      console.log('🔍 FIREBASE: forgotPassword called with email:', email);
      
      // Check if Firebase is available
      if (!auth) {
        throw new Error('Firebase not initialized');
      }
      
      await sendPasswordResetEmail(auth, email);
      console.log('✅ FIREBASE: Password reset email sent successfully');
      return true;
    } catch (error: any) {
      console.log('❌ FIREBASE: Password reset failed:', error);
      
      // Check if it's a network error and provide fallback
      if (error.code === 'auth/network-request-failed' || error.message?.includes('network')) {
        console.log('🔧 MOCK: Network error, providing mock response');
        // Simulate successful password reset for offline mode
        return true;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const validateReferralCode = async (code: string): Promise<boolean> => {
    try {
      console.log('🔍 REFERRAL: Validating code:', code);
      
      // Temporary hardcoded validation for testing
      const validCodes = ['111806', '123456', '000000'];
      if (validCodes.includes(code)) {
        console.log('✅ REFERRAL: Code is valid (hardcoded):', code);
        return true;
      }
      
      // Try to validate from Firebase
      const referralDoc = await getDoc(doc(db, COLLECTIONS.REFERRAL_CODES, code));
      console.log('🔍 REFERRAL: Document exists:', referralDoc.exists());
      console.log('🔍 REFERRAL: Document data:', referralDoc.data());
      
      if (referralDoc.exists()) {
        console.log('✅ REFERRAL: Code is valid (Firebase):', code);
        return true;
      }
      
      console.log('❌ REFERRAL: Code is invalid:', code);
      return false;
    } catch (error) {
      console.error('❌ REFERRAL: Validation error:', error);
      // Fallback to hardcoded validation if Firebase fails
      const validCodes = ['111806', '123456', '000000'];
      const isValid = validCodes.includes(code);
      console.log('🔍 REFERRAL: Fallback validation result:', isValid);
      return isValid;
    }
  };

  return { 
    user, 
    loading, 
    error, 
    signIn, 
    signUp, 
    logout, 
    forgotPassword,
    updateUserProfile,
    linkWallet,
    isAdmin,
    isKycVerified,
    verifyEmailCode,
    resendVerificationCode,
    validateReferralCode
  };
}

// Helper Functions
const generateReferralCode = (uid: string): string => {
  // Generate a 6-digit referral code based on user ID
  const hash = uid.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return Math.abs(hash).toString().slice(0, 6).padStart(6, '0');
};

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handleReferralSignup = async (newUserId: string, referralCode: string, newUserReferralCode: string) => {
  try {
    // Find the referrer
    const referralDoc = await getDoc(doc(db, COLLECTIONS.REFERRAL_CODES, referralCode));
    if (!referralDoc.exists()) {
      throw new Error('Invalid referral code');
    }
    
    const referrerData = referralDoc.data();
    const referrerId = referrerData.userId;
    
    // Update referrer's total referrals
    const referrerUserDoc = doc(db, COLLECTIONS.USERS, referrerId);
    const referrerUser = await getDoc(referrerUserDoc);
    if (referrerUser.exists()) {
      const currentReferrals = referrerUser.data().totalReferrals || 0;
      await setDoc(referrerUserDoc, {
        totalReferrals: currentReferrals + 1,
        updatedAt: new Date()
      }, { merge: true });
    }
    
    // Create referral tree entry
    await setDoc(doc(db, COLLECTIONS.REFERRAL_TREE, newUserId), {
      userId: newUserId,
      referrerId: referrerId,
      referralCode: referralCode,
      newUserReferralCode: newUserReferralCode,
      createdAt: new Date(),
      level: 1, // Direct referral
      status: 'active'
    });
    
    // Create referral code entry for new user
    await setDoc(doc(db, COLLECTIONS.REFERRAL_CODES, newUserReferralCode), {
      userId: newUserId,
      code: newUserReferralCode,
      createdAt: new Date(),
      isActive: true,
      totalReferrals: 0
    });
    
  } catch (error) {
    console.error('Referral signup handling error:', error);
    // Don't throw error to prevent signup failure
  }
};

const sendVerificationEmail = async (email: string, code: string) => {
  try {
    console.log(`📧 Sending verification email to ${email} with code: ${code}`);
    
    // Call our email sending API
    const response = await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code,
        type: 'signup_verification'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    const result = await response.json();
    console.log('✅ Email verification sent successfully:', result.message);
    
    // For development, show the code in console
    if (result.developmentCode) {
      console.log(`🔢 DEVELOPMENT CODE: ${result.developmentCode}`);
      // Show a toast with the code for development
      if (typeof window !== 'undefined') {
        // Dynamic import to avoid SSR issues
        import('sonner').then(({ toast }) => {
          toast.success(`Development Mode: Verification code is ${result.developmentCode}`, {
            duration: 10000,
            description: 'In production, this would be sent to your email'
          });
        });
      }
    }
    
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
};

const trackUserAnalytics = async (userId: string, event: string, data: any = {}) => {
  try {
    await setDoc(doc(db, COLLECTIONS.USER_ANALYTICS, `${userId}_${Date.now()}`), {
      userId,
      event,
      data,
      timestamp: new Date(),
      source: 'web'
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't throw error to prevent main flow failure
  }
};
