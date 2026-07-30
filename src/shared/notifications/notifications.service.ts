import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApiErrorCode } from 'src/common/http/api-error';
import { paginated } from 'src/common/http/api-response.dto';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CreateNotificationDto,
  NotifyContent,
  NotifyOptions,
  NotifyRolesOptions,
} from './notifications.dto';
import { NotificationType, UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { GlobalNotificationsService } from '../global-notifications/global-notifications.service';
import { MailerService } from '../mailer/mailer.service';
import { WEBSITE_URL } from 'src/common/constants';
import { escapeHtml } from '../mailer/templates/base.template';

/** Roles treated as staff for notifyAdmins(). */
export const ADMIN_ROLES: UserRole[] = [UserRole.admin, UserRole.superadmin];

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * How long a broadcast stays visible unless the caller says otherwise.
 * Announcements previously had no expiry at all, so every one ever sent was
 * still being served months later.
 */
const BROADCAST_TTL_DAYS = 30;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private globalNotifications: GlobalNotificationsService,
    private mailer: MailerService,
  ) {}

  // ──────────────────────────────────────────────
  //  Sending
  // ──────────────────────────────────────────────

  /**
   * Notify one person. Use this for anything addressed to a specific user
   * ("your contract was approved").
   */
  async notifyUser(userId: string, options: NotifyOptions) {
    const { type, email, ...content } = options;

    const notification = await this.prisma.notification.create({
      data: { userId, type, ...content },
    });

    if (email) await this.emailUsers([userId], content);

    return notification;
  }

  /** Notify several people with the same content. */
  async notifyUsers(userIds: string[], options: NotifyOptions) {
    if (userIds.length === 0) return { count: 0 };

    const { type, email, ...content } = options;

    const result = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, ...content })),
    });

    if (email) await this.emailUsers(userIds, content);

    return result;
  }

  /** Notify several people, each with their own content. */
  async notifyEach(
    entries: Array<{ userId: string; content: NotifyContent }>,
    type: NotificationType,
  ) {
    if (entries.length === 0) return { count: 0 };

    return this.prisma.notification.createMany({
      data: entries.map(({ userId, content }) => ({
        userId,
        type,
        ...content,
      })),
    });
  }

  /**
   * Broadcast to whole roles. Stored once with a per-user view record rather
   * than fanned out into a row per user.
   *
   * Rejects an empty role list: downstream, "no roles" means "visible to every
   * user", so an accidentally-empty array would silently turn a staff-only
   * message into a site-wide announcement. Use notifyEveryone() to say that on
   * purpose.
   */
  async notifyRoles(roles: UserRole[], options: NotifyRolesOptions) {
    if (roles.length === 0) {
      // Deliberately a plain Error, not an HttpException: no request can cause
      // this, it only fires when calling code is wrong. Surfacing it as a 500
      // is the correct outcome.
      throw new Error(
        'notifyRoles() needs at least one role. Use notifyEveryone() to reach all users.',
      );
    }
    return this.broadcast(roles, options);
  }

  /** Broadcast to every user, whatever their role. */
  async notifyEveryone(options: NotifyRolesOptions) {
    return this.broadcast([], options);
  }

  private async broadcast(roles: UserRole[], options: NotifyRolesOptions) {
    const {
      type,
      email,
      priority,
      icon,
      expiresAt,
      requiresAction,
      ...content
    } = options;

    // `undefined` means "caller didn't say" and gets the default TTL; an
    // explicit null means "keep this visible indefinitely".
    const expiry =
      expiresAt === undefined
        ? new Date(Date.now() + BROADCAST_TTL_DAYS * 24 * 60 * 60 * 1000)
        : expiresAt;

    const notification = await this.globalNotifications.create({
      ...content,
      type,
      targetRoles: roles,
      priority,
      icon,
      requiresAction,
      expiresAt: expiry?.toISOString(),
    });

    if (email) await this.emailRoles(roles, content);

    return notification;
  }

  /**
   * Broadcast to admins and superadmins — the common "staff needs to look at
   * this" case. Prefer this over calling notifyRoles with the admin roles
   * spelled out, so the targeting can't be forgotten.
   */
  async notifyAdmins(options: NotifyRolesOptions) {
    return this.notifyRoles(ADMIN_ROLES, options);
  }

  // ──────────────────────────────────────────────
  //  Email delivery (opt-in — nothing emails by default)
  // ──────────────────────────────────────────────

  /** Look up addresses and email them. Never throws — mail is best-effort. */
  private async emailUsers(userIds: string[], content: NotifyContent) {
    const users = await this.prisma.appUser.findMany({
      where: { id: { in: userIds }, isEnabled: true },
      select: { email: true },
    });

    await this.deliver(
      users.map((u) => u.email),
      content,
    );
  }

  private async emailRoles(roles: UserRole[], content: NotifyContent) {
    const users = await this.prisma.appUser.findMany({
      // No roles means everyone, matching how the notification itself is shown.
      // Filtering on `in: []` would instead match nobody.
      where: {
        isEnabled: true,
        ...(roles.length > 0 && { role: { in: roles } }),
      },
      select: { email: true },
    });

    await this.deliver(
      users.map((u) => u.email),
      content,
    );
  }

  private async deliver(recipients: string[], content: NotifyContent) {
    if (recipients.length === 0) return;

    // bcc so recipients never see each other's addresses.
    await this.mailer.sendTemplateSafe({
      to: recipients[0],
      bcc: recipients.slice(1),
      from: 'noreply',
      subject: content.title,
      heading: content.title,
      paragraphs: [escapeHtml(content.message)],
      button: content.link
        ? { label: 'Open in Podocarpus', url: `${WEBSITE_URL}${content.link}` }
        : undefined,
    });
  }

  // ──────────────────────────────────────────────
  //  Reading
  // ──────────────────────────────────────────────

  /** Raw create — kept for the admin endpoint. Prefer the notify* helpers. */
  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto });
  }

  /**
   * A user's own notifications, newest first. Global notifications are served
   * separately by /global-notifications.
   */
  async getRelatedNotifications(
    { userId }: CurrentUser,
    limit = DEFAULT_PAGE_SIZE,
    offset = 0,
  ) {
    const take = Math.min(limit, MAX_PAGE_SIZE);

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take,
        skip: offset,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return paginated(items, total, take, offset);
  }

  /**
   * Scoped to the caller's own notifications. A missing id and someone else's
   * id both raise the same 404 — distinguishing them would let a caller probe
   * which notification ids exist.
   */
  async markAsRead(id: string, userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'read', readAt: new Date() },
    });

    if (updated.count === 0) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Notification not found.',
      });
    }

    return { success: true, message: 'Notification marked as read' };
  }

  async markAllAsRead(user: CurrentUser) {
    const [direct, broadcast] = await Promise.all([
      this.prisma.notification.updateMany({
        where: { userId: user.userId, status: 'unread' },
        data: { status: 'read', readAt: new Date() },
      }),
      this.globalNotifications.markAllAsViewed(user),
    ]);

    const updated = direct.count + broadcast;

    return {
      success: true,
      message: `Marked ${updated} notification${updated === 1 ? '' : 's'} as read`,
      updated,
    };
  }

  /**
   * Unread totals for the bell badge, across both sources — a direct
   * notification is unread until its status flips, a broadcast until the user
   * has a view record for it.
   */
  async getUnreadCount(user: CurrentUser) {
    const [direct, broadcast] = await Promise.all([
      this.prisma.notification.count({
        where: { userId: user.userId, status: 'unread' },
      }),
      this.globalNotifications.getUnreadCount(user),
    ]);

    return { direct, broadcast, total: direct + broadcast };
  }

  /**
   * Everything addressed to this user, both sources merged and sorted newest
   * first. The frontend previously had to call two endpoints and interleave
   * them itself.
   */
  async getInbox(
    user: CurrentUser,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ) {
    const { unreadOnly = false, limit = DEFAULT_PAGE_SIZE } = options;

    const [direct, broadcasts] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId: user.userId,
          ...(unreadOnly && { status: 'unread' as const }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.globalNotifications.getActiveNotifications(user, {
        unreadOnly,
        limit,
      }),
    ]);

    const items = [
      ...direct.map((n) => ({
        id: n.id,
        scope: 'direct' as const,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        json: n.json,
        createdAt: n.createdAt,
        read: n.status === 'read',
      })),
      ...broadcasts.map((n) => ({
        id: n.id,
        scope: 'broadcast' as const,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        json: n.json,
        createdAt: n.createdAt,
        read: n.viewed,
        priority: n.priority,
        icon: n.icon,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return items;
  }
}
