import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sendVerificationEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    // During build time, return success to avoid Firebase issues
    if (process.env.NODE_ENV === 'production' && process.env.NETLIFY === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Build-time response - email service not available',
        timestamp: new Date().toISOString()
      });
    }

    const { email, code, type = 'signup_verification' } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    console.log(`📧 Attempting to send verification email to ${email} with code: ${code}`);

    // Send email using Gmail SMTP
    const emailResult = await sendVerificationEmail(email, code, {
      retries: 3 // Retry up to 3 times if sending fails
    });

    if (!emailResult.success) {
      console.error('❌ Email sending failed:', emailResult.error);
      throw new Error(emailResult.error || 'Failed to send email');
    }

    // Store verification request in Firebase for tracking
    await setDoc(doc(db, COLLECTIONS.EMAIL_VERIFICATION, `${email}_${Date.now()}`), {
      email,
      code,
      sentAt: new Date(),
      type,
      messageId: emailResult.messageId,
      status: 'sent',
      provider: 'gmail_smtp'
    });

    console.log(`✅ Verification email sent successfully to ${email}`);
    console.log(`📧 Message ID: ${emailResult.messageId}`);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      messageId: emailResult.messageId,
      // For development, include the code in the response
      // Remove this in production!
      developmentCode: process.env.NODE_ENV === 'development' ? code : undefined
    });

  } catch (error: any) {
    console.error('❌ Email sending error:', error);
    
    // Store failed attempt in Firebase for debugging
    try {
      const { email, code } = await request.json();
      if (email && code) {
        await setDoc(doc(db, COLLECTIONS.EMAIL_VERIFICATION, `failed_${email}_${Date.now()}`), {
          email,
          code,
          sentAt: new Date(),
          status: 'failed',
          error: error.message || 'Unknown error',
          provider: 'gmail_smtp'
        });
      }
    } catch (logError) {
      console.error('Failed to log error to Firebase:', logError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to send verification email',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
