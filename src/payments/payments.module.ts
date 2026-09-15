import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './services/payments.service';
import { RentScheduleService } from './services/rent-schedule.service';
import { PaymentsDashboardService } from './services/payments-dashboard.service';
import { PaymentsMonthlyService } from './services/payments-monthly.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    RentScheduleService,
    PaymentsDashboardService,
    PaymentsMonthlyService,
  ],
  // RentScheduleService is exported so PropertiesModule can generate a
  // collection schedule while creating a tenant lease.
  exports: [PaymentsService, RentScheduleService],
})
export class PaymentsModule {}
