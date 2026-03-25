import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

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
import { NotificationsModule } from './shared/notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
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
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
