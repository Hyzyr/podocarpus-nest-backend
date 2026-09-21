export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Single source of truth for token lifetimes. The JWT `expiresIn` and the
// cookie `maxAge` are both derived from these so they can never drift apart.
export const ACCESS_TOKEN_TTL_SEC = 60 * 60 * 2; // 2 hours
export const REFRESH_TOKEN_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export const ACCESS_TOKEN_TTL = `${ACCESS_TOKEN_TTL_SEC}s`;
export const REFRESH_TOKEN_TTL = `${REFRESH_TOKEN_TTL_SEC}s`;
