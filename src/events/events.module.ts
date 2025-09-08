import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { DatabaseModule } from 'src/_helpers/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
