import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { PropertiesController } from './properties.controller';
import { TenantLeasesController } from './tenant-leases.controller';
import { PropertiesService } from './services/properties.service';
import { PropertiesNotificationsService } from './services/properties.notifications.service';
import { TenantLeasesService } from './services/tenant-leases.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  exports: [PropertiesService, TenantLeasesService],
  controllers: [PropertiesController, TenantLeasesController],
  providers: [PropertiesService, PropertiesNotificationsService, TenantLeasesService],
})
export class PropertiesModule {}
