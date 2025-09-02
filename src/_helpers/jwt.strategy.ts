import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';
import { JWT_SECRET } from 'src/constants';
import { TokenPayload } from '../auth/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Look in cookies first
        (req: FastifyRequest) => {
          return req?.cookies?.access_token || null;
        },
        // fallback to header if you still want to support Bearer
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
