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
import { CreateNotificationDto, NotificationDto, NotificationIdParamDto, MarkAsReadResponseDto } from './notifications.dto';
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
    summary: 'Get current user notifications',
    description: 'Returns all notifications for the authenticated user, including user-specific and global notifications.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user notifications retrieved successfully.',
    type: [NotificationDto],
  })
  getMyNotifications(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.getRelatedNotifications(user);
  }

  @Get('inbox')
  @ApiOperation({
    summary: 'Everything addressed to the current user',
    description:
      'Direct notifications and role broadcasts merged into one list, newest first. Broadcasts sent before the user registered are excluded.',
  })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Merged notification list.' })
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
      'Returns { direct, broadcast, total } so the badge needs a single request.',
  })
  @ApiResponse({ status: 200, description: 'Unread counts.' })
  getUnreadCount(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.getUnreadCount(user);
  }

  @Patch(':id/read')
  @ApiOperation({ 
    summary: 'Mark a notification as read',
    description: 'Mark a specific notification as read for the current user.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification marked as read successfully.',
    type: MarkAsReadResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notification not found or does not belong to user.',
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
    description: 'Mark all notifications as read for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'All user notifications marked as read successfully.',
    type: MarkAsReadResponseDto,
  })
  markAllAsRead(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.markAllAsRead(user);
  }
}
