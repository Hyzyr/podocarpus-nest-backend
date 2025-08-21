import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesService } from './properties/properties.service';
import { PropertiesController } from './properties/properties.controller';
import { PropertiesModule } from './properties/properties.module';
import { InvestmentsService } from './investments/investments.service';
import { InvestmentsController } from './investments/investments.controller';
import { InvestmentsModule } from './investments/investments.module';
import { AppointmentsService } from './appointments/appointments.service';
import { DatabaseModule } from './_helpers/database/database.module';
import { AppointmentsController } from './appointments/appointments.controller';
import { AppointmentsModule } from './appointments/appointments.module';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from './_helpers/mailer/mailer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    PropertiesModule,
    InvestmentsModule,
    AppointmentsModule,
    DatabaseModule,
    MailerModule,
  ],
  controllers: [
    AppController,
    PropertiesController,
    InvestmentsController,
    AppointmentsController,
  ],
  providers: [PropertiesService, InvestmentsService, AppointmentsService],
})
export class AppModule {}
