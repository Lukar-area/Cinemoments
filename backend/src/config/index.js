import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'cinemoments_super_secret_jwt_key_2026_dev_mode_only!',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    fileEncryptionKey: process.env.FILE_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cinemoments',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    // Payment configuration
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_cinemoments_demo',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_sec_test_secret_key_demo',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_cinemoments_demo',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_cinemoments_demo',
    upiVpa: process.env.UPI_VPA || 'cinemoments@upi',
    // Notification & alert configuration
    emailServiceEnabled: process.env.EMAIL_SERVICE_ENABLED === 'true',
    smtpHost: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    smtpPort: parseInt(process.env.SMTP_PORT || '2525', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'CineMoments Alerts <notifications@cinemoments.com>',
    smsServiceEnabled: process.env.SMS_SERVICE_ENABLED === 'true',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
};
