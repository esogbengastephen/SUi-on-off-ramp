// Gmail SMTP configuration
const createTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const senderName = process.env.GMAIL_SENDER_NAME || 'SwitcherFi Support';

  if (!gmailUser || !gmailAppPassword) {
    console.warn('⚠️ Gmail SMTP credentials not found, falling back to console logging');
    return null;
  }

  console.log('🔧 Creating Gmail SMTP transporter...');
  
  // Use dynamic import for nodemailer to avoid build issues
  const nodemailer = require('nodemailer');
  
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
    // Additional configuration for better reliability
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
    rateDelta: 20000, // 20 seconds between batches
    rateLimit: 5, // Max 5 emails per rateDelta
  });
};

// Get transporter instance
let transporter: any = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Email sending function with retry logic
export const sendEmailViaSMTP = async (
  to: string,
  subject: string,
  html: string,
  options: {
    retries?: number;
    from?: string;
    replyTo?: string;
  } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const { retries = 3, from, replyTo } = options;
  
  // Get Gmail credentials
  const gmailUser = process.env.GMAIL_USER;
  const senderName = process.env.GMAIL_SENDER_NAME || 'SwitcherFi Support';
  
  // Development mode fallback
  if (process.env.NODE_ENV === 'development' && !gmailUser) {
    console.log(`📧 [DEV MODE] EMAIL WOULD BE SENT TO: ${to}`);
    console.log(`📧 [DEV MODE] SUBJECT: ${subject}`);
    console.log(`📧 [DEV MODE] HTML CONTENT: ${html.length} characters`);
    return { success: true, messageId: `dev_${Date.now()}` };
  }

  const transporter = getTransporter();
  
  if (!transporter) {
    const error = 'Gmail SMTP not configured properly. Check environment variables.';
    console.error('❌', error);
    return { success: false, error };
  }

  const mailOptions = {
    from: from || `"${senderName}" <${gmailUser}>`,
    to,
    subject,
    html,
    replyTo: replyTo || gmailUser,
    // Additional headers for better deliverability
    headers: {
      'X-Mailer': 'SwitcherFi App',
      'X-Priority': '1',
    },
  };

  // Retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Sending email to ${to} (attempt ${attempt}/${retries})...`);
      
      const info = await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully to ${to}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📧 Response: ${info.response}`);
      
      return {
        success: true,
        messageId: info.messageId,
      };
      
    } catch (error: any) {
      console.error(`❌ Email sending failed (attempt ${attempt}/${retries}):`, error.message);
      
      // If it's the last attempt, return the error
      if (attempt === retries) {
        return {
          success: false,
          error: error.message || 'Unknown email sending error',
        };
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
};

// Specific function for verification emails
export const sendVerificationEmail = async (
  email: string,
  code: string,
  options: {
    retries?: number;
  } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const subject = 'SwitcherFi - Verify Your Email Address';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - SwitcherFi</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
          background: linear-gradient(135deg, #007BFF, #5DADE2); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 10px 10px 0 0; 
        }
        .content { 
          background: #f8f9fa; 
          padding: 30px; 
          border-radius: 0 0 10px 10px; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .code { 
          font-size: 32px; 
          font-weight: bold; 
          color: #007BFF; 
          letter-spacing: 4px; 
          text-align: center; 
          margin: 20px 0; 
          padding: 20px; 
          background: white; 
          border-radius: 8px; 
          border: 2px dashed #007BFF; 
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          color: #666; 
          font-size: 14px; 
        }
        .footer a { 
          color: #007BFF; 
          text-decoration: none; 
        }
        .features { 
          margin: 20px 0; 
        }
        .features ul { 
          list-style: none; 
          padding: 0; 
        }
        .features li { 
          padding: 8px 0; 
          border-bottom: 1px solid #eee;
        }
        .features li:last-child { 
          border-bottom: none; 
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
        }
        .warning { 
          background: #fff3cd; 
          border: 1px solid #ffeaa7; 
          border-radius: 6px; 
          padding: 15px; 
          margin: 20px 0; 
          color: #856404; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🚀 SwitcherFi</div>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Your gateway to seamless crypto-to-fiat swaps</p>
        </div>
        <div class="content">
          <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
          <p>Thank you for signing up for SwitcherFi! To complete your account setup, please enter the verification code below:</p>
          
          <div class="code">${code}</div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>This code will not expire</li>
              <li>Enter this code in the SwitcherFi app to verify your email</li>
              <li>If you didn't create an account, please ignore this email</li>
              <li>Never share this code with anyone</li>
            </ul>
          </div>
          
          <div class="features">
            <p><strong>Once verified, you'll have access to:</strong></p>
            <ul>
              <li>⚡ Lightning-fast crypto swaps</li>
              <li>🔒 Bank-grade security</li>
              <li>📞 24/7 customer support</li>
              <li>💱 Competitive exchange rates</li>
              <li>📱 Mobile-optimized experience</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 8px;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">Welcome to the future of crypto trading! 🌟</p>
          </div>
          
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@switcherfi.com">support@switcherfi.com</a></p>
            <p style="margin: 10px 0 0 0;">© 2025 SwitcherFi. Secure. Fast. Reliable.</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
              This email was sent to ${email}. If you didn't request this, please ignore it.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailViaSMTP(email, subject, html, options);
};

// Test email function
export const sendTestEmail = async (
  to: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const subject = 'SwitcherFi - Test Email';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #007BFF;">🧪 SwitcherFi Test Email</h2>
      <p>This is a test email to verify that Gmail SMTP is working correctly.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      <p style="color: #28a745;">✅ If you receive this email, Gmail SMTP is configured correctly!</p>
    </div>
  `;

  return sendEmailViaSMTP(to, subject, html);
};

// Export the main function for backward compatibility
export { sendEmailViaSMTP as default };
