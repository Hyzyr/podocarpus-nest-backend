import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './services/properties.service';
import { PropertiesNotificationsService } from './services/properties.notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  exports: [PropertiesService],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesNotificationsService],
})
export class PropertiesModule {}
