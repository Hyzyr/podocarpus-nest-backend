import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { InvestmentStatisticsController } from './investment-statistics.controller';
import { ContractsService } from './services/contracts.service';
import { ContractsNotificationsService } from './services/contracts.notifications.service';
import { InvestmentStatisticsService } from './services/investment-statistics.service';
import { DatabaseModule } from 'src/shared/database/database.module';
import { NotificationsModule } from 'src/shared/notifications/notifications.module';
import { PropertiesModule } from 'src/properties/properties.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, PropertiesModule],
  controllers: [ContractsController, InvestmentStatisticsController],
  providers: [ContractsService, ContractsNotificationsService, InvestmentStatisticsService],
  exports: [ContractsService, InvestmentStatisticsService],
})
export class ContractsModule {}
