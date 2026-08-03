/**
 * Send a real branded test email, to check how a template lands in an inbox —
 * where Gmail and Outlook strip things a browser renders fine.
 *
 *   npm run mail:test -- you@example.com
 *   npm run mail:test -- you@example.com welcome
 *
 * For a quicker look without sending anything, run the app and open
 * http://localhost:8000/dev/emails.
 *
 * Uses the SMTP settings from .env, and only ever sends to the address given.
 */
import 'dotenv/config';
import * as nodemailer from 'nodemailer';
import { renderEmail } from '../src/shared/mailer/templates/base.template';
import {
  EMAIL_SAMPLES,
  findSample,
} from '../src/shared/mailer/templates/preview-samples';

async function main() {
  const to = process.argv[2];
  const which = process.argv[3] || 'confirm';
  const keys = EMAIL_SAMPLES.map((s) => s.key).join(' | ');

  if (!to) {
    console.error(`Usage: npm run mail:test -- <email> [${keys}]`);
    process.exit(1);
  }

  const sample = findSample(which);
  if (!sample) {
    console.error(`Unknown template "${which}". Options: ${keys}`);
    process.exit(1);
  }

  const {
    MAIL_HOST,
    MAIL_PORT,
    MAIL_USER,
    MAIL_PASS,
    MAIL_FROM,
    MAIL_FROM_NAME,
  } = process.env;

  if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS) {
    console.error(
      'SMTP is not configured. Set MAIL_HOST, MAIL_USER and MAIL_PASS in .env',
    );
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

  const { html, text } = renderEmail(sample.template);

  console.log(`Connecting to ${MAIL_HOST}:${port} …`);
  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"${MAIL_FROM_NAME || 'Podocarpus'}" <${MAIL_FROM || MAIL_USER}>`,
    to,
    subject: `[TEST] ${sample.subject}`,
    text,
    html,
  });

  console.log(`Sent "${sample.name}" to ${to}`);
  console.log(`Message id: ${info.messageId}`);
}

main().catch((err: Error) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
