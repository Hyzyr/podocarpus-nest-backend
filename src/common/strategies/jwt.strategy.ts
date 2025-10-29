import { Injectable } from '@nestjs/common';
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

  async validate(payload: TokenPayload) {
    // will be available in req.user
    return { userId: '' + payload.sub, role: payload.role };
  }
}
