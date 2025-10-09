import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing email delivery to: ${email}`);

    // Send test email using Gmail SMTP
    const result = await sendTestEmail(email);

    if (!result.success) {
      console.error('❌ Test email failed:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to send test email' 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Test email sent successfully to ${email}`);
    console.log(`📧 Message ID: ${result.messageId}`);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      email: email
    });

  } catch (error: any) {
    console.error('❌ Test email error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send test email',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
