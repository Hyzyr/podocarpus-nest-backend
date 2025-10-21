import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/_helpers/database/database.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [DatabaseModule],
  exports: [PropertiesService],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
