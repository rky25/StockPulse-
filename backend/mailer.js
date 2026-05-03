const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'StockPulse';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, 
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

const sendEmail = async (to, subject, text, html) => {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.error('SMTP credentials not configured in .env');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
};

const sendVerificationEmail = (email, otp) => {
  const subject = 'Your StockPulse Verification Code';
  const text = `Your verification code is: ${otp}. It will expire in 10 minutes.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #2e6c80;">Welcome to StockPulse!</h2>
      <p>Thank you for signing up. Please use the following One-Time Password (OTP) to complete your registration:</p>
      <div style="font-size: 24px; font-weight: bold; padding: 10px; background-color: #f4f4f4; text-align: center; letter-spacing: 5px; border-radius: 4px;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
    </div>
  `;
  return sendEmail(email, subject, text, html);
};

const sendResetPasswordEmail = (email, otp) => {
  const subject = 'Reset Your StockPulse Password';
  const text = `Your password reset code is: ${otp}. It will expire in 10 minutes.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #d9534f;">Password Reset Request</h2>
      <p>We received a request to reset your password. Please use the following code to proceed:</p>
      <div style="font-size: 24px; font-weight: bold; padding: 10px; background-color: #f4f4f4; text-align: center; letter-spacing: 5px; border-radius: 4px;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email. This code will expire in 10 minutes.</p>
    </div>
  `;
  return sendEmail(email, subject, text, html);
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
