const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

const sendEmail = async (to, subject, text, html) => {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  const payload = JSON.stringify({
    from: 'StockPulse <onboarding@resend.dev>',
    to: [to],
    subject,
    text,
    html,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('Email sent successfully via Resend');
            resolve(true);
          } else {
            console.error('Resend API error:', res.statusCode, body);
            resolve(false);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('Error sending email via Resend:', err.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
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
