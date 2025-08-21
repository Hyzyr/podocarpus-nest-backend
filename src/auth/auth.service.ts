import {
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService, 
  ) {}

  async register(email: string, password: string, role: UserRole) {
    const existing = await this.prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.appUser.create({
      data: {
        email,
        passwordHash: hash,
        role,
      },
    });

    const payload: TokenPayload = { sub: user.id, role: user.role };
    return {
      user: { id: user.id, email: user.email, role: user.role },
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.appUser.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
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
}
