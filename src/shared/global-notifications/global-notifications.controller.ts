import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GlobalNotificationsService } from './global-notifications.service';
import {
  CreateGlobalNotificationDto,
  UpdateGlobalNotificationDto,
  GlobalNotificationDto,
  GetGlobalNotificationsResponseDto,
  GlobalNotificationStatsDto,
  GlobalNotificationIdParamDto,
  GetAllNotificationsQueryDto,
  NotificationActionResponseDto,
  GetAllNotificationsResponseDto,
  GetAnalyticsResponseDto,
} from './global-notifications.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('global-notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('global-notifications')
export class GlobalNotificationsController {
  constructor(
    private readonly globalNotificationsService: GlobalNotificationsService,
  ) {}

  /**
   * Create a new global notification
   * Admin/superadmin only
   */
  @UseGuards(RolesGuard)
  @Post()
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new global notification (Admin only)',
    description:
      'Creates a system-wide notification visible to specified roles. If targetRoles is empty, visible to all users.',
  })
  @ApiResponse({
    status: 201,
    description: 'Global notification created successfully',
    type: GlobalNotificationDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not admin or superadmin',
  })
  async create(
    @CurrentUser() user: CurrentUser,
    @Body() dto: CreateGlobalNotificationDto,
  ) {
    // Authorization check
    const adminRoles: UserRole[] = [UserRole.admin, UserRole.superadmin];
    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Only admins can create global notifications',
      );
    }

    return this.globalNotificationsService.create(dto);
  }

  /**
   * Update an existing global notification
   * Admin/superadmin only
   */
  @UseGuards(RolesGuard)
  @Patch(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Update a global notification (Admin only)',
    description: 'Update an existing global notification by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Global notification updated successfully',
    type: GlobalNotificationDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not admin or superadmin',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async update(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: GlobalNotificationIdParamDto,
    @Body() dto: UpdateGlobalNotificationDto,
  ) {
    const adminRoles: UserRole[] = [UserRole.admin, UserRole.superadmin];
    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Only admins can update global notifications',
      );
    }

    return this.globalNotificationsService.update(id, dto);
  }

  /**
   * Get active global notifications for current user
   * Filtered by user's role and active status
   */
  @Get()
  @ApiOperation({
    summary: 'Get active global notifications for current user',
    description:
      'Returns all active global notifications that target the user\'s role, sorted by creation date (newest first). Includes viewed and dismissed status.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active global notifications retrieved successfully.',
    type: GetGlobalNotificationsResponseDto,
  })
  async getActiveNotifications(
    @CurrentUser() user: CurrentUser,
  ): Promise<GetGlobalNotificationsResponseDto> {
    const notifications =
      await this.globalNotificationsService.getActiveNotifications(user);

    const unviewedCount = notifications.filter((n) => !n.viewed).length;

    // Map to ensure null values are handled properly for DTO
    const mappedNotifications = notifications.map((n) => ({
      ...n,
      link: n.link || undefined,
      icon: n.icon || undefined,
      json: n.json || undefined,
    }));

    return {
      notifications: mappedNotifications as any,
      total: notifications.length,
      unviewedCount,
    };
  }

  /**
   * Mark a notification as viewed
   * This is called when a user sees the notification in their feed/toast
   */
  @Patch(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a notification as viewed',
    description:
      'Records that the user has seen this notification. Useful for tracking engagement.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as viewed successfully.',
    type: NotificationActionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found.',
  })
  async markAsViewed(
    @Param() { id }: GlobalNotificationIdParamDto,
    @CurrentUser() user: CurrentUser,
  ) {
    await this.globalNotificationsService.markAsViewed(
      id,
      user.userId,
      false,
    );

    return { success: true, message: 'Notification marked as viewed' };
  }

  /**
   * Dismiss a notification
   * Marks it as dismissed so it won't show up in the feed again
   */
  @Patch(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dismiss a notification',
    description:
      'User explicitly dismisses a notification (hides it from their feed)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification dismissed successfully.',
    type: NotificationActionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found.',
  })
  async dismissNotification(
    @Param() { id }: GlobalNotificationIdParamDto,
    @CurrentUser() user: CurrentUser,
  ) {
    await this.globalNotificationsService.dismissNotification(
      id,
      user.userId,
    );

    return { success: true, message: 'Notification dismissed' };
  }

  /**
   * Get view statistics for a notification
   * Admin/superadmin only
   */
  @UseGuards(RolesGuard)
  @Get(':id/stats')
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Get statistics for a global notification (Admin only)',
    description:
      'Returns view counts, dismissal rates, and engagement metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully.',
    type: GlobalNotificationStatsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not admin or superadmin',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found.',
  })
  async getStats(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: GlobalNotificationIdParamDto,
  ) {
    const adminRoles: UserRole[] = [UserRole.admin, UserRole.superadmin];
    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Only admins can view notification statistics',
      );
    }

    return this.globalNotificationsService.getNotificationStats(id);
  }

  /**
   * Get detailed view analytics for a notification
   * Admin/superadmin only
   */
  @UseGuards(RolesGuard)
  @Get(':id/analytics')
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Get detailed analytics for a notification (Admin only)',
    description:
      'Returns breakdown of views by role, time, and dismissal data',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed view analytics retrieved successfully.',
    type: GetAnalyticsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not admin or superadmin',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found.',
  })
  async getAnalytics(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: GlobalNotificationIdParamDto,
  ) {
    const adminRoles: UserRole[] = [UserRole.admin, UserRole.superadmin];
    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Only admins can view notification analytics',
      );
    }

    return this.globalNotificationsService.getViewAnalytics(id);
  }

  /**
   * Get all global notifications for admin dashboard
   * Admin/superadmin only - with pagination
   */
  @UseGuards(RolesGuard)
  @Get('admin/all')
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Get all global notifications (Admin only)',
    description:
      'Get all notifications with view counts for admin dashboard. Supports pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'All global notifications retrieved successfully.',
    type: GetAllNotificationsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not admin or superadmin',
  })
  async getAllNotifications(
    @CurrentUser() user: CurrentUser,
    @Query() query: GetAllNotificationsQueryDto,
  ) {
    const adminRoles: UserRole[] = [UserRole.admin, UserRole.superadmin];
    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Only admins can view all notifications',
      );
    }

    return this.globalNotificationsService.getAllNotifications(
      query.limit,
      query.offset,
    );
  }

  /**
   * Delete a global notification
   * Admin/superadmin only
   */
  @UseGuards(RolesGuard)
  @Delete(':id')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a global notification (Admin only)',
    description: 'Permanently delete a global notification by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully.',
    type: NotificationActionResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not admin or superadmin',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found.',
  })
  async delete(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: GlobalNotificationIdParamDto,
  ) {
    const adminRoles: UserRole[] = [UserRole.admin, UserRole.superadmin];
    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Only admins can delete global notifications',
      );
    }

    await this.globalNotificationsService.delete(id);

    return { success: true, message: 'Notification deleted successfully' };
  }
}
