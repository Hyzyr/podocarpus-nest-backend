import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(UsersService.name);

  
  create(user: any) {
    this.logger.log(`Creating user: ${JSON.stringify(user)}`);
    return { message: 'User created', user };
  }

  findAll() {
    this.logger.log('Fetching all users');
    return this.prisma.appUser.findMany();
  }
  findOne(id: string) {
    this.logger.log(`Fetching user with id=${id}`);
    return { id, name: 'Bob' };
  }
  update(id: string, update: any) {
    this.logger.log(`Updating user ${id} with ${JSON.stringify(update)}`);
    return { message: 'User updated', id, update };
  }
  remove(id: string) {
    this.logger.warn(`Removing user ${id}`);
    return { message: 'User removed', id };
  }
}
