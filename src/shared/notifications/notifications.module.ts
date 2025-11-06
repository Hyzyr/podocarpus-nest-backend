import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DatabaseModule } from 'src/shared/database/database.module';
import { GlobalNotificationsModule } from '../global-notifications/global-notifications.module';

@Module({
  imports: [DatabaseModule, GlobalNotificationsModule],
  exports: [NotificationsService, GlobalNotificationsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
