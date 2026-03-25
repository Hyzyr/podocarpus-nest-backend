export const WEBSITE_NAME = 'Podocarpus Real Estate LLC';
export const COOKIE_SECRET = process.env.COOKIE_SECRET || 'podocarpus-secret';
export const JWT_SECRET = process.env.JWT_SECRET || 'podocarpus-secret';
export const WEBSITE_DOMAIN = process.env.WEBSITE_DOMAIN || 'pdcps.co';
export const WEBSITE_URL = process.env.WEBSITE_URL || 'https://pdcps.co';
export const UPLOADS_URL = process.env.UPLOADS_LOCATION || '/uploads';

// Warn if default secrets are used in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || !process.env.COOKIE_SECRET) {
    throw new Error(
      'FATAL: JWT_SECRET and COOKIE_SECRET must be set in production. ' +
      'Generate with: openssl rand -base64 32',
    );
  }
}

// mailer details :
export const MAIL_HOST = process.env.MAIL_HOST || '';
export const MAIL_USER = process.env.MAIL_USER || '';
export const MAIL_PASS = process.env.MAIL_PASS || '';
