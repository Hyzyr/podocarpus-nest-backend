import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DatabaseModule } from 'src/shared/database/database.module';
import { GlobalNotificationsModule } from 'src/global-notifications/global-notifications.module';
import { GlobalNotificationsService } from 'src/global-notifications/global-notifications.service';

@Module({
  imports: [DatabaseModule, GlobalNotificationsModule],
  exports: [NotificationsService, GlobalNotificationsService],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
