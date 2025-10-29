import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { AdminUserDto } from './dto/user.get.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.appUser.findMany({});
  }
  async findOneFullInfo(id: string) {
    const user = await this.prisma.appUser.findUnique({
      where: { id },
      include: {
        investorProfile: {
          include: {
            preferences: true,
            contracts: { include: { property: true } },
          },
        },
        brokerProfile: true,
        adminProfile: true,
        appointments: { include: { property: true } },
        // propertyStatuses: true,
        // eventStatuses: true,
        // activityLogs: true,
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
  // async create(dto: AdminUserDto) {
  //   return this.prisma.appUser.create({
  //     data: dto,
  //   });
  // }
  async update(id: string, dto: Partial<AdminUserDto>) {
    return this.prisma.appUser.update({
      where: { id },
      data: dto,
    });
  }
  async remove(id: string) {
    return this.prisma.appUser.delete({ where: { id } });
  }
}
