import { Module } from '@nestjs/common';
import { GlobalNotificationsController } from './global-notifications.controller';
import { GlobalNotificationsService } from './global-notifications.service';
import { DatabaseModule } from 'src/shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GlobalNotificationsController],
  providers: [GlobalNotificationsService],
  exports: [GlobalNotificationsService],
})
export class GlobalNotificationsModule {}
