import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './services/contracts.service';
import { ContractsNotificationsService } from './services/contracts.notifications.service';
import { DatabaseModule } from 'src/shared/database/database.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PropertiesModule } from 'src/properties/properties.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, PropertiesModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractsNotificationsService],
})
export class ContractsModule {}
