import { MAIL_FROM, MAIL_FROM_NAME, WEBSITE_URL } from 'src/common/constants';

/**
 * Named senders. Pick one per message via `MailerService.sendMail({ from: 'support' })`.
 *
 * IMPORTANT (Gmail SMTP): Google only lets you send as an address that is a
 * verified alias / "Send mail as" identity on the authenticated account. Adding
 * a key here is not enough — the alias must exist in Google Workspace, otherwise
 * Gmail silently rewrites the From header back to the account address.
 * Until an alias is configured, these all resolve to MAIL_FROM.
 */
export const MAIL_SENDERS = {
  /** Default. Customer-facing mail people may reply to. */
  support: {
    address: MAIL_FROM,
    name: MAIL_FROM_NAME,
  },
  /** Transactional mail that should not invite replies. */
  noreply: {
    address: process.env.MAIL_FROM_NOREPLY || MAIL_FROM,
    name: MAIL_FROM_NAME,
  },
  /** Internal/admin alerts. */
  admin: {
    address: process.env.MAIL_FROM_ADMIN || MAIL_FROM,
    name: `${MAIL_FROM_NAME} Admin`,
  },
} as const;

export type MailSenderKey = keyof typeof MAIL_SENDERS;

/**
 * Brand tokens mirrored from the frontend design system
 * (podocarpus-next/src/UI/assets/styles/_variables.scss).
 *
 * Kept as plain hex strings because email clients strip CSS custom properties —
 * every value has to be inlined at render time.
 */
export const BRAND = {
  // Neutrals (n-scale)
  ink: '#172730', // n900 — headings, dark surfaces
  body: '#414e55', // n600 — body copy
  muted: '#828a8f', // n100 — secondary/footer copy
  faint: '#c5c9cb', // n50  — on-dark secondary copy
  border: '#e1e3e4', // n40
  hairline: '#eceeee', // n30
  surface: '#f6f6f7', // n20 — page background
  white: '#ffffff', // n0

  // Accents
  primary: '#3e63b8', // accent-3-500 — links
  primaryDark: '#2c4683', // accent-3-700
  teal: '#3eafb8', // accent-1-500

  // Brand gold, sampled from the logo mark
  gold: '#b8912f',
  goldSoft: '#e8d9ae',

  // Status tones for info boxes
  warnBg: '#fcfaeb', // y50
  warnBorder: '#e9d559', // y200
  warnInk: '#8b7c22', // y500
  dangerBg: '#f8ecec', // r50
  dangerBorder: '#c16060', // r200
  dangerInk: '#6e2626', // r500
  successBg: '#f4faeb', // g50
  successBorder: '#a2d25b', // g200
  successInk: '#577b23', // g500
} as const;

/**
 * Chillax / Clash Display are custom webfonts and will not load in mail
 * clients, so we ship the same fallback chain the frontend declares.
 */
export const FONT_STACK =
  "'Montserrat', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Absolute URL — email clients cannot resolve relative paths. */
export const LOGO_URL = `${WEBSITE_URL}/images/website/podocarpus-logo-golden.png`;

export const EMAIL_MAX_WIDTH = 600;
