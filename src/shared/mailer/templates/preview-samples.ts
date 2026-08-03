import { EmailTemplateOptions } from './base.template';

/**
 * Sample content for every email the app sends.
 *
 * Single source for both the browser preview (`/dev/emails`) and the send test
 * (`npm run mail:test`), so what you look at is what gets delivered. Add an
 * entry here when you add an email and it shows up in both.
 */
export interface EmailSample {
  /** URL slug and CLI argument. */
  key: string;
  /** Shown in the preview index. */
  name: string;
  /** What sends it. */
  trigger: string;
  subject: string;
  template: EmailTemplateOptions;
}

export const EMAIL_SAMPLES: EmailSample[] = [
  {
    key: 'welcome',
    name: 'Welcome + disown',
    trigger: 'POST /auth/register (password signup)',
    subject: 'Welcome to Podocarpus',
    template: {
      preheader: 'Your account is ready.',
      heading: 'Welcome to Podocarpus',
      paragraphs: [
        'Your Podocarpus account is ready. You can now browse investment-ready properties, track returns, and manage your contracts in one place.',
      ],
      button: { label: 'Go to your dashboard', url: 'https://pdcps.co' },
      showLinkFallback: false,
      infoBox: {
        label: "Didn't sign up?",
        text: 'Someone may have used your address by mistake. <a href="https://pdcps.co/not-me?token=demo" style="color:inherit;font-weight:600;">Let us know</a> and we&#39;ll block this account right away.',
        tone: 'warn',
      },
    },
  },
  {
    key: 'welcome-google',
    name: 'Welcome (Google signup)',
    trigger: 'POST /auth/google — first sign-in',
    subject: 'Welcome to Podocarpus',
    template: {
      preheader: 'Your account is ready.',
      heading: 'Welcome to Podocarpus',
      paragraphs: [
        'Your Podocarpus account is ready. You can now browse investment-ready properties, track returns, and manage your contracts in one place.',
      ],
      button: { label: 'Go to your dashboard', url: 'https://pdcps.co' },
      showLinkFallback: false,
    },
  },
  {
    key: 'confirm',
    name: 'Confirm extra email',
    trigger: 'POST /auth/emails',
    subject: 'Confirm your email for Podocarpus',
    template: {
      preheader: 'Confirm this address to finish adding it to your account.',
      heading: 'Confirm your email',
      paragraphs: [
        '<b>contact@example.com</b> was added as an additional contact email on your Podocarpus account.',
        'Confirm it so we can use this address for documents and important updates.',
      ],
      button: {
        label: 'Confirm email',
        url: 'https://pdcps.co/verify-email?token=demo9f2c1a4b7e',
      },
      infoBox: {
        text: 'This link expires in 30 minutes and can only be used once.',
        tone: 'info',
      },
      footnote:
        "If you didn't request this, you can safely ignore this email — nothing will be added.",
    },
  },
  {
    key: 'reset',
    name: 'Reset password',
    trigger: 'POST /auth/forgot-password',
    subject: 'Reset your password',
    template: {
      preheader: 'Use this link to choose a new password.',
      heading: 'Reset your password',
      paragraphs: [
        'We received a request to reset the password for your Podocarpus account.',
        'Choose a new password using the button below.',
      ],
      button: {
        label: 'Reset password',
        url: 'https://pdcps.co/reset-password?token=demo7d41e0c9',
      },
      infoBox: {
        text: 'This link expires in 15 minutes and can only be used once.',
        tone: 'info',
      },
      footnote:
        "If you didn't request a password reset, you can safely ignore this email — your password will stay the same.",
    },
  },
  {
    key: 'notification',
    name: 'Notification (opt-in email)',
    trigger: 'notifyAdmins({ email: true })',
    subject: 'Signup Disowned — Account Blocked',
    template: {
      heading: 'Signup Disowned — Account Blocked',
      paragraphs: [
        'someone@example.com clicked &quot;this wasn&#39;t me&quot; on their welcome email. The account has been blocked pending review.',
      ],
      button: {
        label: 'Open in Podocarpus',
        url: 'https://pdcps.co/users/demo-user-id',
      },
    },
  },
];

export const findSample = (key: string): EmailSample | undefined =>
  EMAIL_SAMPLES.find((s) => s.key === key);
