const nodemailer = require('nodemailer');

const {
  FROM_EMAIL,
  FROM_NAME,
  BREVO_SMTP_HOST,
  BREVO_SMTP_PORT,
  BREVO_SMTP_USER,
  BREVO_SMTP_PASS,
} = process.env;

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!BREVO_SMTP_HOST || !BREVO_SMTP_USER || !BREVO_SMTP_PASS) {
    console.error('Email not configured: missing SMTP env vars');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: BREVO_SMTP_HOST,
    port: Number(BREVO_SMTP_PORT || 587),
    secure: false,
    auth: {
      user: BREVO_SMTP_USER,
      pass: BREVO_SMTP_PASS,
    },
  });
  return transporter;
}

async function sendVerificationEmail(to, code) {
  const tx = getTransporter();
  if (!tx) throw new Error('Email transport is not configured');
  const fromName = FROM_NAME || 'No-Reply';
  const fromEmail = FROM_EMAIL || 'no-reply@example.com';

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:16px;border:1px solid #eee;border-radius:8px;">
    <h2 style="margin:0 0 12px;">Verify your email</h2>
    <p>Use the verification code below to complete your registration:</p>
    <div style="font-size:28px;letter-spacing:6px;font-weight:700;background:#f7f7f7;padding:12px 16px;text-align:center;border-radius:6px;">${code}</div>
    <p style="color:#666">This code will expire in 10 minutes.</p>
    <p style="color:#666">If you didn't request this, you can safely ignore this email.</p>
  </div>`;

  await tx.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: 'Your verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html,
  });
}

module.exports = {
  sendVerificationEmail,
};
