import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/_helpers/database/database.module';
import { UserEventStatusService } from './event.status.service';
import { UserEventStatusController } from './event.status.controller';

@Module({
  imports: [DatabaseModule],
  providers: [UserEventStatusService],
  controllers: [UserEventStatusController],
})
export class EventStatusModule {}
