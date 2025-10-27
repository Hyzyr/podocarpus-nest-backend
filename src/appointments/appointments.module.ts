import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/_helpers/database/database.module';
import { AppointmentController } from './appointments.controller';
import { AppointmentService } from './appointments.service';
import { AppointmentsNotificationsService } from './appointments.notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentsNotificationsService],
})
export class AppointmentModule {}
