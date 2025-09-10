import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import { PublicPropertySchema } from './dto/investments.dto';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async findInvestorProperties(userId: string) {
    const data = await this.prisma.investorProfile.findUnique({
      where: { userId },
      include: { properties: true },
    });
    return PublicPropertySchema.array().parse(data?.properties);
  }
  async bindInvestmentTo(userId: string, propertyId: string) {
    const data = await this.prisma.investorProfile.update({
      where: { userId },
      data: { properties: { connect: { id: propertyId } } },
      include: { properties: true },
    });

    return PublicPropertySchema.array().parse(data.properties);
  }
}
