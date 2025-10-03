import { Module } from '@nestjs/common';
import {
  UsersAdminController,
  PublicUsersController,
} from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/_helpers/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersAdminController, PublicUsersController],
  providers: [UsersService],
})
export class UsersModule {}
