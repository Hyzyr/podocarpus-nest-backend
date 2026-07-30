import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CreateGlobalNotificationDto,
  UpdateGlobalNotificationDto,
  GlobalNotificationStatsDto,
} from './global-notifications.dto';
import { NotificationType, UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Injectable()
export class GlobalNotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new global notification
   * Admin/superadmin only
   */
  async create(dto: CreateGlobalNotificationDto) {
    return this.prisma.globalNotification.create({
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type || NotificationType.system,
        targetRoles: dto.targetRoles || [],
        link: dto.link,
        priority: dto.priority || 'normal',
        icon: dto.icon,
        json: dto.json,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive !== false,
        requiresAction: dto.requiresAction ?? false,
      },
    });
  }

  /**
   * Update an existing global notification
   * Admin/superadmin only
   */
  async update(id: string, dto: UpdateGlobalNotificationDto) {
    return this.prisma.globalNotification.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.message && { message: dto.message }),
        ...(dto.type && { type: dto.type }),
        ...(dto.targetRoles !== undefined && { targetRoles: dto.targetRoles }),
        ...(dto.link !== undefined && { link: dto.link }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.json !== undefined && { json: dto.json }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get active global notifications for the current user
   * Uses role-based filtering - only shows notifications targeting user's role
   * Filters out expired notifications
   */
  async getActiveNotifications(
    user: CurrentUser,
    options: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
  ) {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;

    const notifications = await this.prisma.globalNotification.findMany({
      where: {
        ...(await this.visibleTo(user)),
        // "Unread" for a broadcast means no view record exists for this user.
        ...(unreadOnly && { views: { none: { userId: user.userId } } }),
      },
      include: {
        views: {
          where: { userId: user.userId },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    });

    return notifications.map((notif) => ({
      ...notif,
      viewed: notif.views.length > 0,
      dismissed: notif.views[0]?.dismissed || false,
    }));
  }

  /**
   * Mark an actionable broadcast as handled. Unlike read state, this is shared:
   * once any admin resolves it, it clears for everyone. Use it for work items
   * ("review this blocked account"), never for announcements.
   *
   * Idempotent — a second call by another admin leaves the original handler and
   * timestamp in place rather than overwriting who dealt with it.
   */
  async resolve(id: string, userId: string, note?: string) {
    const notification = await this.prisma.globalNotification.findUnique({
      where: { id },
      select: { id: true, requiresAction: true, resolvedAt: true },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    if (!notification.requiresAction) {
      throw new BadRequestException(
        'This notification is an announcement, not a task. Read state is per-user; there is nothing to resolve.',
      );
    }
    if (notification.resolvedAt) {
      return this.prisma.globalNotification.findUnique({ where: { id } });
    }

    return this.prisma.globalNotification.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedById: userId,
        resolutionNote: note,
      },
    });
  }

  /** Reopen a resolved task. */
  async unresolve(id: string) {
    return this.prisma.globalNotification.update({
      where: { id },
      data: { resolvedAt: null, resolvedById: null, resolutionNote: null },
    });
  }

  /** Outstanding work items for this user's role, oldest first. */
  async getOpenTasks(user: CurrentUser) {
    return this.prisma.globalNotification.findMany({
      where: {
        ...(await this.visibleTo(user)),
        requiresAction: true,
        resolvedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** How many broadcasts this user has never opened. */
  async getUnreadCount(user: CurrentUser) {
    return this.prisma.globalNotification.count({
      where: {
        ...(await this.visibleTo(user)),
        views: { none: { userId: user.userId } },
      },
    });
  }

  /**
   * Live notifications this user is allowed to see.
   *
   * Role matching runs in Postgres rather than in JS — filtering after the
   * fetch meant loading every active notification into memory on each request.
   * An empty targetRoles means "everyone", which is why isEmpty is part of the
   * match rather than a special case handled afterwards.
   *
   * Recency is handled by expiry rather than by the reader's join date: a user
   * who registered yesterday still benefits from seeing the properties added
   * this week. What keeps the list short is that broadcasts age out — see
   * BROADCAST_TTL_DAYS.
   */
  private async visibleTo(user: CurrentUser) {
    const now = new Date();

    return {
      isActive: true,
      startsAt: { lte: now },
      // A resolved task is done for everyone, so it leaves the feed entirely.
      // Announcements have requiresAction=false and are unaffected.
      resolvedAt: null,
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        {
          OR: [
            { targetRoles: { isEmpty: true } },
            { targetRoles: { hasSome: [user.role] } },
          ],
        },
      ],
    };
  }

  /**
   * Mark a notification as viewed by the user
   * Creates a view record if it doesn't exist, or updates if dismissed
   */
  async markAsViewed(
    globalNotificationId: string,
    userId: string,
    dismissed: boolean = false,
  ) {
    // Use upsert to create or update the view record
    return this.prisma.globalNotificationView.upsert({
      where: {
        userId_globalNotificationId: {
          userId,
          globalNotificationId,
        },
      },
      create: {
        userId,
        globalNotificationId,
        dismissed,
        viewedAt: new Date(),
      },
      update: {
        viewedAt: new Date(),
        dismissed,
      },
    });
  }

  /**
   * Mark a notification as dismissed
   */
  async dismissNotification(
    globalNotificationId: string,
    userId: string,
  ) {
    return this.markAsViewed(globalNotificationId, userId, true);
  }

  /**
   * Mark all active global notifications as viewed for a user
   * Used when user clicks "mark all as read"
   */
  /**
   * Mark every notification this user can see as viewed.
   *
   * Previously one upsert per notification; now a single insert that skips the
   * rows already there, so the cost no longer scales with the notification count.
   * Existing view records keep their original viewedAt, which is the more
   * accurate reading of "when did they first see it".
   */
  async markAllAsViewed(user: CurrentUser) {
    const notifications = await this.prisma.globalNotification.findMany({
      where: await this.visibleTo(user),
      select: { id: true },
    });

    if (notifications.length === 0) return 0;

    const { count } = await this.prisma.globalNotificationView.createMany({
      data: notifications.map((notif) => ({
        userId: user.userId,
        globalNotificationId: notif.id,
        viewedAt: new Date(),
        dismissed: false,
      })),
      skipDuplicates: true,
    });

    return count;
  }

  /**
   * Get statistics for a specific notification
   * Admin/superadmin only
   */
  async getNotificationStats(
    notificationId: string,
  ): Promise<GlobalNotificationStatsDto> {
    const notification = await this.prisma.globalNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    // Counted in Postgres rather than by loading every view row and filtering
    // in JS — this endpoint is for notifications sent to the whole user base.
    const [targetedUsersCount, viewedCount, dismissedCount] = await Promise.all([
      this.prisma.appUser.count({
        where: {
          isEnabled: true,
          ...(notification.targetRoles.length > 0 && {
            role: { in: notification.targetRoles as UserRole[] },
          }),
        },
      }),
      this.prisma.globalNotificationView.count({
        where: { globalNotificationId: notificationId, dismissed: false },
      }),
      this.prisma.globalNotificationView.count({
        where: { globalNotificationId: notificationId, dismissed: true },
      }),
    ]);

    const viewPercentage =
      targetedUsersCount > 0
        ? Math.round((viewedCount / targetedUsersCount) * 100)
        : 0;

    return {
      notificationId: notification.id,
      title: notification.title,
      targetedUsers: targetedUsersCount,
      viewedCount,
      viewPercentage,
      dismissedCount,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * Get all global notifications for admin dashboard
   * Admin/superadmin only
   */
  async getAllNotifications(
    limit: number = 50,
    offset: number = 0,
  ) {
    const [notifications, total] =
      await this.prisma.$transaction([
        this.prisma.globalNotification.findMany({
          include: {
            _count: {
              select: { views: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.globalNotification.count(),
      ]);

    return {
      notifications: notifications.map((n) => ({
        ...n,
        viewCount: n._count.views,
      })),
      total,
    };
  }

  /**
   * Delete a global notification
   * Admin/superadmin only
   */
  async delete(id: string) {
    return this.prisma.globalNotification.delete({
      where: { id },
    });
  }

  /**
   * Get detailed view analytics for a notification
   * Returns breakdown of views by user role, time, etc.
   */
  async getViewAnalytics(notificationId: string) {
    const views = await this.prisma.globalNotificationView.findMany({
      where: { globalNotificationId: notificationId },
      include: {
        user: {
          select: { id: true, role: true, email: true },
        },
      },
      orderBy: { viewedAt: 'desc' },
    });

    // Group by role
    const viewsByRole = views.reduce(
      (acc, view) => {
        const role = view.user.role;
        if (!acc[role]) {
          acc[role] = { total: 0, dismissed: 0 };
        }
        acc[role].total++;
        if (view.dismissed) acc[role].dismissed++;
        return acc;
      },
      {} as Record<string, { total: number; dismissed: number }>,
    );

    // Calculate time-based trends (hourly)
    const viewsByHour = views.reduce(
      (acc, view) => {
        const hour = new Date(view.viewedAt).getHours();
        if (!acc[hour]) acc[hour] = 0;
        acc[hour]++;
        return acc;
      },
      {} as Record<number, number>,
    );

    return {
      totalViews: views.length,
      totalDismissed: views.filter((v) => v.dismissed).length,
      viewsByRole,
      viewsByHour,
      recentViews: views.slice(0, 10),
    };
  }
}
