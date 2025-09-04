import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './auth.types';
import { FastifyReply, FastifyRequest } from 'fastify';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const setAuthCookies = (
  payload: TokenPayload,
  jwtService: JwtService,
  reply: FastifyReply,
) => {
  //   const jwtService = new JwtService();
  const accessToken = jwtService.sign(payload, { expiresIn: '15m' });
  const refreshToken = jwtService.sign(payload, { expiresIn: '7d' });

  // set cookies
  reply.setCookie(ACCESS_TOKEN_KEY, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // false in local dev
    sameSite: 'lax',
    path: '/', // ✅ cookie available everywhere
    maxAge: 60 * 15, // 15 minutes
    domain: 'podocarpus.test', // optional, leave out if you want it to default to host
  });

  reply.setCookie(REFRESH_TOKEN_KEY, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/', // ✅ important
    maxAge: 60 * 60 * 24 * 7, // 7 days
    domain: 'podocarpus.test', // optional
  });
};
export const removeAuthCookies = (reply: FastifyReply) => {
  // set cookies
  reply.setCookie(ACCESS_TOKEN_KEY, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // immediately expires
    domain: 'podocarpus.test',
  });

  reply.setCookie(REFRESH_TOKEN_KEY, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    domain: 'podocarpus.test',
  });
};
export const getAuthCookies = (req: FastifyRequest) => {
  const cookies = req.cookies as Record<string, string | undefined>;
  return {
    accessToken: cookies[ACCESS_TOKEN_KEY],
    refreshToken: cookies[REFRESH_TOKEN_KEY],
  };
};

// export const getPayloadFromCookies = async (
//   req: FastifyRequest,
//   jwtService: JwtService,
// ): Promise<TokenPayload | null> => {
//   const { accessToken } = getAuthCookies(req);
//   if (!accessToken) return null;

//   try {
//     return await jwtService.verifyAsync<TokenPayload>(accessToken);
//   } catch {
//     return null;
//   }
// };
