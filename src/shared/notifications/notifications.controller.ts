import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  InboxItemDto,
  NotificationDto,
  NotificationIdParamDto,
  UnreadCountDto,
} from './notifications.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(RolesGuard)
  @Post()
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Create a new notification (Admin only)',
    description: 'Create a user-specific notification. For system use or admin only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully.',
    type: NotificationDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not admin or superadmin',
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get notifications addressed to the current user',
    description:
      'Direct notifications only — role broadcasts are not included here. Use /notifications/inbox for both in one list, or /global-notifications for broadcasts alone.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default 50, max 100.' })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of user notifications retrieved successfully.',
    type: [NotificationDto],
  })
  getMyNotifications(
    @CurrentUser() user: CurrentUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationsService.getRelatedNotifications(
      user,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Get('inbox')
  @ApiOperation({
    summary: 'Everything addressed to the current user',
    description:
      'Direct notifications and role broadcasts merged into one list, newest first. Each item carries a `scope` telling you which it is, because the two are marked read through different endpoints.',
  })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default 50.' })
  @ApiResponse({
    status: 200,
    description: 'Merged notification list, newest first.',
    type: [InboxItemDto],
  })
  getInbox(
    @CurrentUser() user: CurrentUser,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getInbox(user, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Unread counts for the bell badge',
    description:
      'Both sources counted in one request. A direct notification is unread until its status flips; a broadcast until the user has viewed it.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread counts.',
    type: UnreadCountDto,
  })
  getUnreadCount(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.getUnreadCount(user);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read',
    description:
      'Marks one of the current user\'s own notifications as read. Returns false (with 200, not 404) if no notification with that id belongs to them.',
  })
  @ApiResponse({
    status: 200,
    description:
      'true if a notification was updated, false if none matched this user.',
    schema: { type: 'boolean', example: true },
  })
  markAsRead(
    @Param() { id }: NotificationIdParamDto,
    @CurrentUser() { userId }: CurrentUser,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description:
      'Marks every direct notification as read and every visible broadcast as viewed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Always true once the update completes.',
    schema: { type: 'boolean', example: true },
  })
  markAllAsRead(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.markAllAsRead(user);
  }
}
