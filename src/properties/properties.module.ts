import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { PropertiesController } from './properties.controller';
import { PropertiesStatisticsController } from './properties.statistics.controller';
import { TenantLeasesController } from './tenant-leases.controller';
import { PropertiesService } from './services/properties.service';
import { PropertiesNotificationsService } from './services/properties.notifications.service';
import { PropertiesStatisticsService } from './services/properties.statistics.service';
import { TenantLeasesService } from './services/tenant-leases.service';
import { NotificationsModule } from 'src/shared/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  exports: [PropertiesService, TenantLeasesService],
  controllers: [
    PropertiesController,
    PropertiesStatisticsController,
    TenantLeasesController,
  ],
  providers: [
    PropertiesService,
    PropertiesNotificationsService,
    PropertiesStatisticsService,
    TenantLeasesService,
  ],
})
export class PropertiesModule {}
