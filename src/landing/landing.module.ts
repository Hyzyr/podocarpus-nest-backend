import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { AdminLandingController, PublicLandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicLandingController, AdminLandingController],
  providers: [LandingService],
})
export class LandingModule {}
