/**
 * Send a real branded test email, to check how the template lands in an inbox.
 *
 *   npm run mail:test -- you@example.com
 *   npm run mail:test -- you@example.com welcome
 *
 * Uses the SMTP settings from .env. Safe to run against production creds —
 * it only sends to the address you pass.
 */
import 'dotenv/config';
import * as nodemailer from 'nodemailer';
import { renderEmail } from '../src/shared/mailer/templates/base.template';

const SAMPLES = {
  welcome: {
    subject: 'Welcome to Podocarpus',
    preheader: 'Your account is ready.',
    heading: 'Welcome to Podocarpus',
    paragraphs: [
      'Your Podocarpus account is ready. You can now browse investment-ready properties, track returns, and manage your contracts in one place.',
    ],
    button: { label: 'Go to your dashboard', url: 'https://pdcps.co' },
    showLinkFallback: false,
    infoBox: {
      label: "Didn't sign up?",
      text: 'Someone may have used your address by mistake. <a href="https://pdcps.co/not-me?token=demo" style="color:inherit;font-weight:600;">Let us know</a> and we\'ll block this account right away.',
      tone: 'warn' as const,
    },
  },
  confirm: {
    subject: 'Confirm your email for Podocarpus',
    preheader: 'Confirm this address to finish adding it to your account.',
    heading: 'Confirm your email',
    paragraphs: [
      '<b>contact@example.com</b> was added as an additional contact email on your Podocarpus account.',
      'Confirm it so we can use this address for documents and important updates.',
    ],
    button: {
      label: 'Confirm email',
      url: 'https://pdcps.co/verify-email?token=demo',
    },
    infoBox: {
      text: 'This link expires in 30 minutes and can only be used once.',
      tone: 'info' as const,
    },
    footnote:
      "If you didn't request this, you can safely ignore this email — nothing will be added.",
  },
  reset: {
    subject: 'Reset your password',
    preheader: 'Use this link to choose a new password.',
    heading: 'Reset your password',
    paragraphs: [
      'We received a request to reset the password for your Podocarpus account.',
      'Choose a new password using the button below.',
    ],
    button: {
      label: 'Reset password',
      url: 'https://pdcps.co/reset-password?token=demo',
    },
    infoBox: {
      text: 'This link expires in 15 minutes and can only be used once.',
      tone: 'info' as const,
    },
    footnote:
      "If you didn't request a password reset, you can safely ignore this email.",
  },
};

async function main() {
  const to = process.argv[2];
  const which = (process.argv[3] || 'confirm') as keyof typeof SAMPLES;

  if (!to) {
    console.error('Usage: npm run mail:test -- <email> [welcome|confirm|reset]');
    process.exit(1);
  }
  if (!SAMPLES[which]) {
    console.error(`Unknown sample "${which}". Options: ${Object.keys(SAMPLES).join(', ')}`);
    process.exit(1);
  }

  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM, MAIL_FROM_NAME } =
    process.env;

  if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS) {
    console.error('SMTP is not configured. Set MAIL_HOST, MAIL_USER and MAIL_PASS in .env');
    process.exit(1);
  }

  const port = Number(MAIL_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port,
    secure: process.env.MAIL_SECURE
      ? process.env.MAIL_SECURE.toLowerCase() === 'true'
      : port === 465,
    auth: { user: MAIL_USER, pass: MAIL_PASS },
  });

  const { subject, ...template } = SAMPLES[which];
  const { html, text } = renderEmail(template);

  console.log(`Connecting to ${MAIL_HOST}:${port} …`);
  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"${MAIL_FROM_NAME || 'Podocarpus'}" <${MAIL_FROM || MAIL_USER}>`,
    to,
    subject: `[TEST] ${subject}`,
    text,
    html,
  });

  console.log(`Sent "${which}" to ${to}`);
  console.log(`Message id: ${info.messageId}`);
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
