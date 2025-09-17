import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import { InvestorPropertySchema } from './dto/investments.dto';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async findInvestorProperties(userId: string) {
    const data = await this.prisma.investorProfile.findUnique({
      where: { userId },
      include: { properties: true },
    });
    const properties = data?.properties;
    const parsedProperties = InvestorPropertySchema.array().parse(properties);
    return parsedProperties;
  }
  async bindInvestmentTo(userId: string, propertyId: string) {
    const data = await this.prisma.investorProfile.update({
      where: { userId },
      data: { properties: { connect: { id: propertyId } } },
      include: { properties: true },
    });

    return InvestorPropertySchema.array().parse(data.properties);
  }
}
