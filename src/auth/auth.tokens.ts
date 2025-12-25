import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './auth.types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { WEBSITE_DOMAIN } from 'src/common/constants';
import {
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_KEY,
  REFRESH_TOKEN_TTL,
} from './auth.constants';

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? WEBSITE_DOMAIN : undefined,
};

export const setAuthCookies = (
  payload: TokenPayload,
  jwtService: JwtService,
  reply: FastifyReply,
) => {
  //   const jwtService = new JwtService();
  const accessToken = jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwtService.sign(payload, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
  removeAuthCookies(reply);

  // set cookies
  reply.setCookie(ACCESS_TOKEN_KEY, accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 2, // 2 hours
  });
  reply.setCookie(REFRESH_TOKEN_KEY, refreshToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 14, // 7 days
  });
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
