import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { DatabaseModule } from 'src/_helpers/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
