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
import { AppointmentsController } from './appointments/appointments.controller';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [UsersModule, AuthModule, PropertiesModule, InvestmentsModule, AppointmentsModule],
  controllers: [AppController, PropertiesController, InvestmentsController, AppointmentsController],
  providers: [PropertiesService, InvestmentsService, AppointmentsService],
})
export class AppModule {}
