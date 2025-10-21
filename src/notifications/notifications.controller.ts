import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './notifications.dto';
import { UpdateNotificationDto } from './notifications.dto';
import { JwtAuthGuard } from 'src/_helpers/jwt-auth.guard';
import { CurrentUser } from 'src/_helpers/user.decorator';

@ApiTags('notifications')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new notification (system use or admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully.',
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({ status: 200, description: 'List of user notifications.' })
  getMyNotifications(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.getRelatedNotifications(user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  markAsRead(@Param('id') id: string, @CurrentUser() { userId }: CurrentUser) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'All user notifications marked as read.',
  })
  markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}
