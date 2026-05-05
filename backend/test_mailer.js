require('dotenv').config();
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
    pass: SMTP_PASSWORD.replace(/\s+/g, ''), // remove spaces just in case
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_USER}>`,
      to: SMTP_USER, // send to self
      subject: "Test Email from StockPulse Backend",
      text: "If you get this, SMTP is working!",
    });
    console.log("SUCCESS! Message ID:", info.messageId);
  } catch (err) {
    console.error("FAILED TO SEND:", err);
  }
}

testEmail();
