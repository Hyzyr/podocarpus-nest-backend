import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';
import { JWT_SECRET } from 'src/common/constants';
import { TokenPayload } from 'src/auth/auth.types';
import { ACCESS_TOKEN_KEY } from 'src/auth/auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: FastifyRequest) => req?.cookies?.[ACCESS_TOKEN_KEY] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  validate(payload: TokenPayload) {
    // A refresh token must never authenticate an API request. Tokens signed
    // before the type claim existed carry no type and pass as access tokens
    // until their (2h) expiry.
    if (payload.type === 'refresh') throw new UnauthorizedException();
    // will be available in req.user
    return { userId: '' + payload.sub, role: payload.role };
  }
}
