import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { InvestmentsModule } from './investments/investments.module';
import { AppointmentModule } from './appointments/appointments.module';
import { DatabaseModule } from 'src/shared/database/database.module';
import { MailerModule } from 'src/shared/mailer/mailer.module';
import { DataModule } from 'src/shared/data/data.module';
import { StorageModule } from 'src/shared/storage/storage.module';
import { EventsModule } from './events/events.module';
import { EventStatusModule } from './events/event.status.module';
import { ContractsModule } from './contracts/contracts.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MailerModule,
    UsersModule,
    AuthModule,
    PropertiesModule,
    InvestmentsModule,
    AppointmentModule,
    DataModule,
    StorageModule,
    EventsModule,
    EventStatusModule,
    ContractsModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
