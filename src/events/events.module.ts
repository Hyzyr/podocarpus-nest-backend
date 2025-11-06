import { Module } from '@nestjs/common';
import { EventsService } from './services/events.service';
import { EventsNotificationsService } from './services/events.notifications.service';
import { EventsAdminController, EventsController } from './events.controller';
import { DatabaseModule } from 'src/shared/database/database.module';
import { NotificationsModule } from 'src/shared/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [EventsService, EventsNotificationsService],
  controllers: [EventsController, EventsAdminController],
})
export class EventsModule {}
