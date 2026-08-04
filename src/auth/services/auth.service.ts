import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { TokenPayload } from '../auth.types';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import {
  GOOGLE_CLIENT_ID,
  WEBSITE_NAME,
  WEBSITE_URL,
} from 'src/common/constants';
import { MailerService } from 'src/shared/mailer/mailer.service';
import { escapeHtml } from 'src/shared/mailer/templates/base.template';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { AuthNotificationsService } from './auth.notifications.service';
import { EmailVerificationService } from './email-verification.service';

import {
  getAuthCookies,
  removeAuthCookies,
  setAuthCookies,
} from '../auth.tokens';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import {
  AuthResponseDto,
  authUserParser,
  OnboardStep1Dto,
  OnboardStep2Dto,
  UpdateProfileDto,
} from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
    private readonly notifications: NotificationsService,
    private readonly authNotifications: AuthNotificationsService,
    private readonly emailVerification: EmailVerificationService,
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

    // Determine if user should be enabled by default
    // Admins/superadmins must be approved by an existing admin
    // Regular users (investor, broker) are enabled by default
    const isEnabledByDefault = role !== UserRole.admin && role !== UserRole.superadmin;

    // create user
    const user = await this.prisma.appUser.create({
      data: {
        email,
        passwordHash: hash,
        role,
        isEnabled: isEnabledByDefault,
      },
    });

    // notify admins about new user (include userId in json for admin routing)
    await this.authNotifications.notifyNewUser(user.id, email, role);

    // Send a welcome email with a "this wasn't me" link. Best-effort: a mail
    // failure must not block registration.
    await this.sendWelcomeEmail(user.id, user.email, true);

    // create tokens
    const payload: TokenPayload = { sub: user.id, role: user.role };
    setAuthCookies(payload, this.jwtService, reply);

    // ...existing code...

    // return safe user info
    return {
      user: authUserParser.parse(user),
    };
  }

  /**
   * Send the post-signup welcome email.
   * @param withDisownLink when true (password signups), include a "this wasn't
   *   me" link that lets the recipient block the account. Google signups get a
   *   plain welcome (their email is already proven by Google).
   */
  private async sendWelcomeEmail(
    userId: string,
    email: string,
    withDisownLink: boolean,
  ): Promise<void> {
    const subject = `Welcome to ${WEBSITE_NAME}`;
    const intro = [
      `Your ${escapeHtml(WEBSITE_NAME)} account is ready. You can now browse investment-ready properties, track returns, and manage your contracts in one place.`,
    ];

    if (!withDisownLink) {
      // Google signups: ownership is already proven, so no security link.
      await this.mailer.sendTemplateSafe({
        to: email,
        subject,
        preheader: 'Your account is ready.',
        heading: 'Welcome to Podocarpus',
        paragraphs: intro,
        button: { label: 'Go to your dashboard', url: `${WEBSITE_URL}` },
      });
      return;
    }

    const notMeUrl = await this.emailVerification.createDisownLink(userId);

    await this.mailer.sendTemplateSafe({
      to: email,
      subject,
      preheader: 'Your account is ready.',
      heading: 'Welcome to Podocarpus',
      paragraphs: intro,
      button: { label: 'Go to your dashboard', url: `${WEBSITE_URL}` },
      showLinkFallback: false,
      infoBox: {
        label: "Didn't sign up?",
        text: `Someone may have used your address by mistake. <a href="${notMeUrl}" style="color:inherit;font-weight:600;">Let us know</a> and we'll block this account right away.`,
        tone: 'warn',
      },
    });
  }
  async login(
    email: string,
    password: string,
    reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.appUser.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Users created via Google sign-in have no local password.
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please continue with Google.',
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Check if user is enabled
    if (!user.isEnabled) {
      throw new UnauthorizedException('Account is disabled. Please contact an administrator.');
    }

    // create tokens
    const payload: TokenPayload = { sub: user.id, role: user.role };
    setAuthCookies(payload, this.jwtService, reply);

    return {
      user: authUserParser.parse(user),
    };
  }
  
  /**
   * Sign in (or sign up) using a Google ID token (credential) obtained on the
   * frontend via Google Identity Services. Verifies the token against Google,
   * then either links/logs in an existing user or creates a new one, and
   * finally sets the same auth cookies used by password login.
   */
  async googleLogin(
    idToken: string,
    reply: FastifyReply,
    role: UserRole = UserRole.investor,
  ): Promise<AuthResponseDto> {
    if (!GOOGLE_CLIENT_ID) {
      throw new BadRequestException('Google sign-in is not configured.');
    }

    // Verify the token: checks signature, expiry, and that it was issued for us.
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload?.email) {
      throw new UnauthorizedException('Google account has no email');
    }
    if (!payload.email_verified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();

    // 1) Find by googleId, or 2) by email (link existing account), or 3) create.
    let user = await this.prisma.appUser.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    let justCreated = false;
    if (!user) {
      // superadmin can never be self-created; investor, broker and admin
      // ("Agent") are all valid self-service roles. Admins/agents start
      // disabled and must be approved by a superadmin — same rule as password
      // registration, so both signup paths behave identically.
      const safeRole =
        role === UserRole.superadmin ? UserRole.investor : role;
      const isEnabledByDefault = safeRole !== UserRole.admin;

      user = await this.prisma.appUser.create({
        data: {
          email,
          googleId,
          role: safeRole,
          isEnabled: isEnabledByDefault,
          emailVerified: true,
          firstName: payload.given_name ?? null,
          lastName: payload.family_name ?? null,
          profilePhotoUrl: payload.picture ?? null,
        },
      });
      justCreated = true;

      await this.authNotifications.notifyNewUser(user.id, email, safeRole);

      // Plain welcome for new Google users — no disown link, since Google has
      // already proven ownership of this email.
      await this.sendWelcomeEmail(user.id, user.email, false);
    } else if (!user.googleId) {
      // Existing password account signing in with Google for the first time: link it.
      user = await this.prisma.appUser.update({
        where: { id: user.id },
        data: {
          googleId,
          emailVerified: true,
          profilePhotoUrl: user.profilePhotoUrl ?? payload.picture ?? null,
        },
      });
    }

    if (!user.isEnabled) {
      throw new UnauthorizedException(
        justCreated
          ? 'Your account was created and is awaiting administrator approval.'
          : 'Account is disabled. Please contact an administrator.',
      );
    }

    const tokenPayload: TokenPayload = { sub: user.id, role: user.role };
    setAuthCookies(tokenPayload, this.jwtService, reply);

    return {
      user: authUserParser.parse(user),
    };
  }

  async logout(reply: FastifyReply) {
    removeAuthCookies(reply);
  }

  async getCurrentUser(req: FastifyRequest): Promise<AuthResponseDto> {
    const { accessToken } = getAuthCookies(req);
    if (!accessToken) throw new UnauthorizedException();

    try {
      const payload =
        await this.jwtService.verifyAsync<TokenPayload>(accessToken);

      const user = await this.prisma.appUser.findUnique({
        where: { id: `${payload.sub}` },
        include: {
          investorProfile: {
            include: {
              preferences: true,
            },
          },
        },
      });

      if (!user) throw new UnauthorizedException();

      // Check if user is enabled
      if (!user.isEnabled) {
        throw new UnauthorizedException('Account is disabled. Please contact an administrator.');
      }

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
      setAuthCookies({ sub: user.id, role: user.role }, this.jwtService, reply);
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
    await this.mailer.sendTemplate({
      to: user.email,
      subject: 'Reset your password',
      preheader: 'Use this link to choose a new password.',
      heading: 'Reset your password',
      paragraphs: [
        'We received a request to reset the password for your Podocarpus account.',
        'Choose a new password using the button below.',
      ],
      button: { label: 'Reset password', url: resetUrl },
      infoBox: {
        text: 'This link expires in 15 minutes and can only be used once.',
        tone: 'info',
      },
      footnote:
        "If you didn't request a password reset, you can safely ignore this email — your password will stay the same.",
    });

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

  async onboardStep1(user: CurrentUser, body: OnboardStep1Dto) {
    const { userId, role } = user;

    const noNeedStep2 = role !== UserRole.investor;

    await this.prisma.appUser.update({
      where: { id: userId.toString() },
      data: { ...body, onboardingCompleted: noNeedStep2 },
    });
    return { status: 'success', message: 'Step 1 saved successfully' };
  }
  async onboardStep2(user: CurrentUser, body: OnboardStep2Dto) {
    const { userId, role } = user;

    if (role === 'investor')
      await this.prisma.appUser.update({
        where: { id: userId.toString() },
        data: {
          onboardingCompleted: true,
          investorProfile: {
            upsert: {
              create: {
                preferences: {
                  create: { ...body },
                },
              },
              update: {
                preferences: {
                  upsert: {
                    where: { investorProfileId: userId.toString() },
                    create: { ...body },
                    update: { ...body },
                  },
                },
              },
            },
          },
        },
      });
    else throw new UnauthorizedException('Only Investors Allowed');

    return { status: 'success', message: 'Step 2 saved successfully' };
  }

  async updateProfile(user: CurrentUser, dto: UpdateProfileDto) {
    const { userId } = user;

    const updatedUser = await this.prisma.appUser.update({
      where: { id: userId.toString() },
      data: dto,
      include: {
        investorProfile: {
          include: {
            preferences: true,
          },
        },
      },
    });

    return {
      user: authUserParser.parse(updatedUser),
    };
  }
}
