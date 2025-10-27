import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsNotificationsService } from './events.notifications.service';
import { EventsAdminController, EventsController } from './events.controller';
import { DatabaseModule } from 'src/_helpers/database/database.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [EventsService, EventsNotificationsService],
  controllers: [EventsController, EventsAdminController],
})
export class EventsModule {}
