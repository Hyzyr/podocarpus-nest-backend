import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { InvestmentsModule } from './investments/investments.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DatabaseModule } from './_helpers/database/database.module';
import { MailerModule } from './_helpers/mailer/mailer.module';
import { DataController } from './data/data.controller';
import { DataModule } from './data/data.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MailerModule,
    UsersModule,
    AuthModule,
    PropertiesModule,
    InvestmentsModule,
    AppointmentsModule,
    DataModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
