import { Injectable } from '@nestjs/common';
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
  async getActiveNotifications(user: CurrentUser) {
    const now = new Date();

    const notifications = await this.prisma.globalNotification.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        // Not yet expired
        OR: [
          { expiresAt: null }, // No expiration
          { expiresAt: { gte: now } }, // Not yet expired
        ],
      },
      include: {
        views: {
          where: { userId: user.userId },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by role after fetching
    return notifications
      .filter((notif) => {
        // Show if no specific roles targeted (visible to all)
        if (notif.targetRoles.length === 0) return true;
        // Show if user's role is in targetRoles
        return notif.targetRoles.includes(user.role);
      })
      .map((notif) => ({
        ...notif,
        viewed: notif.views.length > 0,
        dismissed: notif.views[0]?.dismissed || false,
      }));
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
  async markAllAsViewed(user: CurrentUser) {
    const now = new Date();

    // Get all active global notifications for this user's role
    const notifications = await this.prisma.globalNotification.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      select: { id: true, targetRoles: true },
    });

    // Filter by role - only mark those relevant to user
    const relevantNotifications = notifications.filter((notif) => {
      if (notif.targetRoles.length === 0) return true;
      return notif.targetRoles.includes(user.role);
    });

    // Mark each as viewed (upsert to avoid duplicates)
    const viewPromises = relevantNotifications.map((notif) =>
      this.prisma.globalNotificationView.upsert({
        where: {
          userId_globalNotificationId: {
            userId: user.userId,
            globalNotificationId: notif.id,
          },
        },
        create: {
          userId: user.userId,
          globalNotificationId: notif.id,
          viewedAt: new Date(),
          dismissed: false,
        },
        update: {
          viewedAt: new Date(),
        },
      }),
    );

    await Promise.all(viewPromises);
    return relevantNotifications.length;
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
      include: {
        views: true,
      },
    });

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Count target users based on role
    let targetedUsersCount = 0;
    if (notification.targetRoles.length === 0) {
      // If no specific roles, count all enabled users
      targetedUsersCount = await this.prisma.appUser.count({
        where: { isEnabled: true },
      });
    } else {
      // Count users with matching roles
      targetedUsersCount = await this.prisma.appUser.count({
        where: {
          isEnabled: true,
          role: { in: notification.targetRoles as UserRole[] },
        },
      });
    }

    const viewedCount = notification.views.filter(
      (v) => !v.dismissed,
    ).length;
    const dismissedCount = notification.views.filter(
      (v) => v.dismissed,
    ).length;
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
