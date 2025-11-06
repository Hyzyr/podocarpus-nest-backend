import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { AppointmentController } from './appointments.controller';
import { AppointmentService } from './services/appointments.service';
import { AppointmentsNotificationsService } from './services/appointments.notifications.service';
import { NotificationsModule } from 'src/shared/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentsNotificationsService],
})
export class AppointmentModule {}
