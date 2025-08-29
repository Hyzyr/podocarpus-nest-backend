import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { TokenPayload } from './auth.types';
import * as crypto from 'crypto';
import { WEBSITE_URL } from 'src/constants';
import { MailerService } from 'src/_helpers/mailer/mailer.service';
import { AuthResponseDto, authUserParser } from './dto';
import { getAuthCookies, setAuthCookies } from './auth.tokens';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async register(
    email: string,
    password: string,
    role: UserRole,
    reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const existing = await this.prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // create user
    const user = await this.prisma.appUser.create({
      data: {
        email,
        passwordHash: hash,
        role,
      },
    });

    // create tokens
    const payload: TokenPayload = { sub: user.id, role: user.role };
    setAuthCookies(payload, this.jwtService, reply);

    // return safe user info
    return {
      user: authUserParser.parse(user),
    };
  }
  async login(
    email: string,
    password: string,
    reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.appUser.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // create tokens
    const payload: TokenPayload = { sub: user.id, role: user.role };
    setAuthCookies(payload, this.jwtService, reply);

    return {
      user: authUserParser.parse(user),
    };
  }
  async getCurrentUser(req: FastifyRequest): Promise<AuthResponseDto> {
    const { accessToken } = getAuthCookies(req);
    if (!accessToken) throw new UnauthorizedException();
    console.log('getCurrentUser');
    console.log('accessToken: ', accessToken);

    try {
      const payload =
        await this.jwtService.verifyAsync<TokenPayload>(accessToken);

      const user = await this.prisma.appUser.findUnique({
        where: { id: `${payload.sub}` },
      });

      if (!user) throw new UnauthorizedException();

      return {
        user: authUserParser.parse(user),
      };
    } catch {
      throw new UnauthorizedException();
    }
  }
  async refreshTokens(
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const { refreshToken } = getAuthCookies(req);
    if (!refreshToken) throw new UnauthorizedException();

    try {
      const payload =
        await this.jwtService.verifyAsync<TokenPayload>(refreshToken);

      // optionally check if refresh token is revoked in DB
      const user = await this.prisma.appUser.findUnique({
        where: { id: `${payload.sub}` },
      });
      if (!user) throw new UnauthorizedException();

      // issue new tokens
      setAuthCookies(
        { sub: payload.sub, role: payload.role },
        this.jwtService,
        reply,
      );

      return {
        user: authUserParser.parse(user),
      };
    } catch {
      throw new UnauthorizedException();
    }
  }

  async forgotPass(email: string) {
    const user = await this.prisma.appUser.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('No user with this email');

    const token = crypto.randomBytes(32).toString('hex');

    // store token temporarily
    await this.prisma.appUser.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 15), // 15 min
      },
    });

    const resetUrl = `${WEBSITE_URL}/reset-password?token=${token}`;

    // send email
    await this.mailer.sendMail(
      user.email,
      'Password Reset',
      `Reset your password: ${resetUrl}`,
      `<p>Click here: <a href="${resetUrl}">${resetUrl}</a></p>`,
    );

    return { message: 'Reset email sent' };
  }
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.appUser.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }, // not expired
      },
    });
    if (!user) throw new BadRequestException('Invalid or expired token');

    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.appUser.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password reset successful' };
  }
}
