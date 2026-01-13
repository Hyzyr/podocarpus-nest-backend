import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
