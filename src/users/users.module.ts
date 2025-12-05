import { Module } from '@nestjs/common';
import { UsersAdminController } from './users.controller';
import { UsersService } from './services/users.service';
import { KycController } from './kyc.controller';
import { KycService } from './services/kyc.service';
import { DatabaseModule } from 'src/shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersAdminController, KycController],
  providers: [UsersService, KycService],
})
export class UsersModule {}
