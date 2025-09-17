import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { InvestmentsModule } from './investments/investments.module';
import { AppointmentModule } from './appointments/appointments.module';
import { DatabaseModule } from './_helpers/database/database.module';
import { MailerModule } from './_helpers/mailer/mailer.module';
import { DataModule } from './data/data.module';
import { StorageModule } from './storage/storage.module';
import { EventsModule } from './events/events.module';
import { EventStatusModule } from './events/event.status.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
