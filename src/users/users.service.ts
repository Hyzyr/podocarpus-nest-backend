import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { AdminUserDto } from './dto/user.get.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAll(currentUser: CurrentUser) {
    let where: any = {};
    if (currentUser.role !== UserRole.superadmin) {
      where = {
        AND: [
          { role: { not: UserRole.superadmin } },
          { id: { not: currentUser.userId } }
        ]
      };
    }
    return this.prisma.appUser.findMany({ where });
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

  /**
   * Toggle user enabled status (enable/disable user access)
   * @param id User ID
   * @param isEnabled true to enable, false to disable
   * @returns Updated user
   */
  async setEnabled(id: string, isEnabled: boolean) {
    const user = await this.prisma.appUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    return this.prisma.appUser.update({
      where: { id },
      data: { isEnabled },
    });
  }
}
