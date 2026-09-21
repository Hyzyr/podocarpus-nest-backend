import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { TokenPayload } from './auth.types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { WEBSITE_DOMAIN } from 'src/common/constants';
import {
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_TTL,
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_KEY,
  REFRESH_TOKEN_TTL,
  REFRESH_TOKEN_TTL_SEC,
} from './auth.constants';

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain:
    process.env.NODE_ENV === 'production'
      ? `${WEBSITE_DOMAIN}`.replace(/^https?:\/\//, '')
      : undefined,
};

/**
 * Signs both tokens and sets the auth cookies. Returns the refresh token so
 * the caller can persist its hash (see AuthService.issueAuthCookies) — the
 * DB record is what makes server-side revocation possible.
 */
export const setAuthCookies = (
  payload: Pick<TokenPayload, 'sub' | 'role'>,
  jwtService: JwtService,
  reply: FastifyReply,
) => {
  const accessToken = jwtService.sign(
    { ...payload, type: 'access' } satisfies TokenPayload,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
  const refreshToken = jwtService.sign(
    {
      ...payload,
      type: 'refresh',
      jti: crypto.randomUUID(),
    } satisfies TokenPayload,
    { expiresIn: REFRESH_TOKEN_TTL },
  );
  removeAuthCookies(reply);

  // set cookies
  reply.setCookie(ACCESS_TOKEN_KEY, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_TTL_SEC,
  });
  reply.setCookie(REFRESH_TOKEN_KEY, refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_TTL_SEC,
  });

  return { refreshToken };
};
export const removeAuthCookies = (reply: FastifyReply) => {
  reply.setCookie(ACCESS_TOKEN_KEY, '', { ...baseCookieOptions, maxAge: 0 });
  reply.setCookie(REFRESH_TOKEN_KEY, '', { ...baseCookieOptions, maxAge: 0 });
};
export const getAuthCookies = (req: FastifyRequest) => {
  const cookies = req.cookies as Record<string, string | undefined>;
  return {
    accessToken: cookies[ACCESS_TOKEN_KEY],
    refreshToken: cookies[REFRESH_TOKEN_KEY],
  };
};

// Only a hash of the refresh token is stored server-side, so a DB leak does
// not leak usable session tokens.
export const hashRefreshToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');
