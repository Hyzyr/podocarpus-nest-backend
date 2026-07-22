import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailVerificationPurpose } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { MailerService } from 'src/shared/mailer/mailer.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { WEBSITE_NAME, WEBSITE_URL } from 'src/common/constants';
import { AuthNotificationsService } from './auth.notifications.service';

// Magic-link tokens are single-use and short-lived.
const TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes
// Maximum number of extra contact emails a user may attach to their account.
const MAX_EXTRA_EMAILS = 2;

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly authNotifications: AuthNotificationsService,
  ) {}

  /** Hash a raw token for storage. We never persist the raw token. */
  private hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Generate a raw token and return it together with its stored hash. */
  private generateToken(): { raw: string; hash: string } {
    const raw = crypto.randomBytes(32).toString('hex');
    return { raw, hash: this.hash(raw) };
  }

  // -------------------- EXTRA CONTACT EMAILS --------------------

  /** List the extra contact emails attached to a user. */
  async listExtraEmails(user: CurrentUser) {
    return this.prisma.userEmail.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        isVerified: true,
        createdAt: true,
        verifiedAt: true,
      },
    });
  }

  /**
   * Add an extra contact email (unverified) and send a confirmation magic link
   * to it. Extra emails are unique per user only; the same address may be an
   * extra email on other accounts.
   */
  async addExtraEmail(user: CurrentUser, rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();

    // Don't allow re-adding the user's own primary login email as an "extra".
    const account = await this.prisma.appUser.findUnique({
      where: { id: user.userId },
      select: { email: true },
    });
    if (account?.email.toLowerCase() === email) {
      throw new ConflictException(
        'This is already your account email.',
      );
    }

    const count = await this.prisma.userEmail.count({
      where: { userId: user.userId },
    });
    if (count >= MAX_EXTRA_EMAILS) {
      throw new BadRequestException(
        `You can add at most ${MAX_EXTRA_EMAILS} extra emails.`,
      );
    }

    const existing = await this.prisma.userEmail.findUnique({
      where: { userId_email: { userId: user.userId, email } },
    });
    if (existing) {
      throw new ConflictException('You already added this email.');
    }

    const userEmail = await this.prisma.userEmail.create({
      data: { userId: user.userId, email },
    });

    await this.sendExtraEmailConfirmation(user.userId, userEmail.id, email);

    return { message: 'Confirmation email sent' };
  }

  /** Resend the confirmation link for an existing, still-unverified extra email. */
  async resendExtraEmail(user: CurrentUser, userEmailId: string) {
    const userEmail = await this.prisma.userEmail.findFirst({
      where: { id: userEmailId, userId: user.userId },
    });
    if (!userEmail) throw new NotFoundException('Email not found');
    if (userEmail.isVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    await this.sendExtraEmailConfirmation(
      user.userId,
      userEmail.id,
      userEmail.email,
    );

    return { message: 'Confirmation email sent' };
  }

  /** Remove an extra contact email. */
  async deleteExtraEmail(user: CurrentUser, userEmailId: string) {
    const result = await this.prisma.userEmail.deleteMany({
      where: { id: userEmailId, userId: user.userId },
    });
    if (result.count === 0) throw new NotFoundException('Email not found');
    return { message: 'Email removed' };
  }

  /**
   * Confirm an extra email from a magic-link token. Marks the token consumed
   * (single use) and the UserEmail verified, in one transaction.
   */
  async confirmExtraEmail(token: string) {
    const record = await this.prisma.emailVerification.findFirst({
      where: {
        tokenHash: this.hash(token),
        purpose: EmailVerificationPurpose.extra_email,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!record || !record.userEmailId) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.userEmail.update({
        where: { id: record.userEmailId },
        data: { isVerified: true, verifiedAt: new Date() },
      }),
    ]);

    return { message: 'Email confirmed' };
  }

  private async sendExtraEmailConfirmation(
    userId: string,
    userEmailId: string,
    email: string,
  ) {
    // Invalidate any prior unconsumed extra-email tokens for this address.
    await this.prisma.emailVerification.updateMany({
      where: {
        userEmailId,
        purpose: EmailVerificationPurpose.extra_email,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    const { raw, hash } = this.generateToken();
    await this.prisma.emailVerification.create({
      data: {
        userId,
        userEmailId,
        purpose: EmailVerificationPurpose.extra_email,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const link = `${WEBSITE_URL}/verify-email?token=${raw}`;
    await this.mailer.sendMail(
      email,
      `Confirm your email for ${WEBSITE_NAME}`,
      `Confirm this email address by opening: ${link}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
      `<p>Confirm this email address for your ${WEBSITE_NAME} account:</p>
       <p><a href="${link}">Confirm email</a></p>
       <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>`,
    );
  }

  // -------------------- SIGNUP DISOWN ("this wasn't me") --------------------

  /**
   * Create a disown token and return the magic-link URL to embed in the signup
   * welcome email. Clicking it (after confirming on the frontend) blocks the
   * account and notifies admins.
   */
  async createDisownLink(userId: string): Promise<string> {
    const { raw, hash } = this.generateToken();
    await this.prisma.emailVerification.create({
      data: {
        userId,
        purpose: EmailVerificationPurpose.disown_signup,
        tokenHash: hash,
        // Give people longer to notice an unexpected signup email.
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });
    return `${WEBSITE_URL}/not-me?token=${raw}`;
  }

  /**
   * Consume a disown token: block the account (isEnabled=false) and notify
   * admins so they can review, delete, or unblock the user.
   */
  async disownSignup(token: string) {
    const record = await this.prisma.emailVerification.findFirst({
      where: {
        tokenHash: this.hash(token),
        purpose: EmailVerificationPurpose.disown_signup,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    if (!record) throw new BadRequestException('Invalid or expired token');

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.appUser.update({
        where: { id: record.userId },
        data: { isEnabled: false, disownedAt: new Date() },
      }),
    ]);

    await this.authNotifications.notifyDisownedSignup(
      record.user.id,
      record.user.email,
    );

    return {
      message:
        'Thank you. This account has been blocked and our team has been notified.',
    };
  }
}
