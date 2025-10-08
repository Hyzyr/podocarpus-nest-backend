import { Module } from '@nestjs/common';
import { UsersAdminController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/_helpers/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersAdminController],
  providers: [UsersService],
})
export class UsersModule {}
