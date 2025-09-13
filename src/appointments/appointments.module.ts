import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/_helpers/database/database.module';
import { AppointmentController } from './appointments.controller';
import { AppointmentService } from './appointments.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
