import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CreateInvestmentStatisticsDto,
  InvestmentSummaryDto,
  RoiChartDataDto,
} from '../dto/investment-statistics.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class InvestmentStatisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Create or update monthly statistics for a contract
   */
  async createMonthlyStatistics(dto: CreateInvestmentStatisticsDto) {
    // Check if statistics already exist for this month/year/contract
    const existing = await this.prisma.investmentStatistics.findFirst({
      where: {
        contractId: dto.contractId,
        month: dto.month,
        year: dto.year,
      },
    });

    // Get contract details
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: {
        investor: true,
        property: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${dto.contractId} not found`);
    }

    // Calculate totals
    const totalExpenses =
      (dto.serviceCharge || 0) +
      (dto.maintenanceCost || 0) +
      (dto.otherExpenses || 0);

    const netProfit = (dto.rentReceived || 0) - totalExpenses;

    // Calculate ROI percentage based on contract value
    const contractValue = contract.contractValue || 0;
    const roiPercentage =
      contractValue > 0
        ? (netProfit / contractValue) * 100
        : 0;

    // Get previous cumulative values
    const previousStats = await this.prisma.investmentStatistics.findFirst({
      where: {
        contractId: dto.contractId,
        OR: [
          { year: dto.year, month: { lt: dto.month } },
          { year: { lt: dto.year } },
        ],
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const cumulativeProfit =
      (previousStats?.cumulativeProfit || 0) + netProfit;
    const cumulativeRoi =
      contractValue > 0
        ? (cumulativeProfit / contractValue) * 100
        : 0;

    const statisticsData = {
      contractId: dto.contractId,
      tenantLeaseId: dto.tenantLeaseId,
      month: dto.month,
      year: dto.year,
      rentReceived: dto.rentReceived || 0,
      serviceCharge: dto.serviceCharge || 0,
      maintenanceCost: dto.maintenanceCost || 0,
      otherExpenses: dto.otherExpenses || 0,
      totalExpenses,
      netProfit,
      roiPercentage,
      cumulativeProfit,
      cumulativeRoi,
      daysOccupied: dto.daysOccupied || 0,
      daysVacant: dto.daysVacant || 0,
      wasVacant: dto.wasVacant || false,
    };

    let statistics;
    if (existing) {
      statistics = await this.prisma.investmentStatistics.update({
        where: { id: existing.id },
        data: statisticsData,
      });
    } else {
      statistics = await this.prisma.investmentStatistics.create({
        data: statisticsData,
      });
    }

    // Send notification for significant ROI milestones
    if (cumulativeRoi >= 10 && (!previousStats || previousStats.cumulativeRoi < 10)) {
      await this.notifications.create({
        userId: contract.investorId,
        type: NotificationType.contract,
        title: '🎉 10% Cumulative ROI Achieved!',
        message: `Your investment in "${contract.property.title}" has reached 10% cumulative ROI`,
        link: `/contracts/${contract.id}`,
        targetRoles: [UserRole.investor],
      });
    }

    // Notify on negative monthly performance
    if (netProfit < 0) {
      await this.notifications.create({
        userId: contract.investorId,
        type: NotificationType.contract,
        title: 'Negative Monthly Performance',
        message: `Your property "${contract.property.title}" had a net loss of ${Math.abs(netProfit).toFixed(2)} this month`,
        link: `/contracts/${contract.id}`,
        targetRoles: [UserRole.investor],
      });
    }

    return statistics;
  }

  /**
   * Get all statistics for a contract
   */
  async findByContract(contractId: string) {
    return this.prisma.investmentStatistics.findMany({
      where: { contractId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  /**
   * Get statistics for a specific month/year
   */
  async findByMonthYear(contractId: string, month: number, year: number) {
    const statistics = await this.prisma.investmentStatistics.findFirst({
      where: { contractId, month, year },
    });

    if (!statistics) {
      throw new NotFoundException(
        `No statistics found for ${month}/${year}`,
      );
    }

    return statistics;
  }

  /**
   * Get investment summary for a contract
   */
  async getInvestmentSummary(contractId: string): Promise<InvestmentSummaryDto> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const statistics = await this.prisma.investmentStatistics.findMany({
      where: { contractId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const latestStats = statistics[0];
    const totalMonths = statistics.length;

    // Calculate averages
    const totalRentReceived = statistics.reduce(
      (sum, stat) => sum + stat.rentReceived,
      0,
    );
    const totalExpenses = statistics.reduce(
      (sum, stat) => sum + stat.totalExpenses,
      0,
    );
    const totalNetProfit = statistics.reduce(
      (sum, stat) => sum + stat.netProfit,
      0,
    );

    const avgMonthlyRent = totalMonths > 0 ? totalRentReceived / totalMonths : 0;
    const avgMonthlyExpenses = totalMonths > 0 ? totalExpenses / totalMonths : 0;
    const avgMonthlyProfit = totalMonths > 0 ? totalNetProfit / totalMonths : 0;

    // Occupancy rate
    const totalDaysOccupied = statistics.reduce(
      (sum, stat) => sum + stat.daysOccupied,
      0,
    );
    const totalDaysVacant = statistics.reduce(
      (sum, stat) => sum + stat.daysVacant,
      0,
    );
    const totalDays = totalDaysOccupied + totalDaysVacant;
    const occupancyRate =
      totalDays > 0 ? (totalDaysOccupied / totalDays) * 100 : 0;

    return {
      contractValue: contract.contractValue || 0,
      currentCumulativeProfit: latestStats?.cumulativeProfit || 0,
      currentCumulativeRoi: latestStats?.cumulativeRoi || 0,
      totalMonthsTracked: totalMonths,
      totalRentReceived,
      totalExpenses,
      totalNetProfit,
      averageMonthlyRent: avgMonthlyRent,
      averageMonthlyExpenses: avgMonthlyExpenses,
      averageMonthlyProfit: avgMonthlyProfit,
      occupancyRate,
      lastUpdated: latestStats?.updatedAt || contract.updatedAt,
    };
  }

  /**
   * Get ROI chart data for visualization
   */
  async getRoiChartData(
    contractId: string,
    months: number = 12,
  ): Promise<RoiChartDataDto> {
    const statistics = await this.prisma.investmentStatistics.findMany({
      where: { contractId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: months,
    });

    // Reverse to show oldest to newest
    statistics.reverse();

    return {
      labels: statistics.map((stat) => `${stat.month}/${stat.year}`),
      monthlyRoi: statistics.map((stat) => stat.roiPercentage),
      cumulativeRoi: statistics.map((stat) => stat.cumulativeRoi),
      monthlyProfit: statistics.map((stat) => stat.netProfit),
      cumulativeProfit: statistics.map((stat) => stat.cumulativeProfit),
      rentReceived: statistics.map((stat) => stat.rentReceived),
      expenses: statistics.map((stat) => stat.totalExpenses),
    };
  }

  /**
   * Get annual summary for a contract
   */
  async getAnnualSummary(contractId: string, year: number) {
    const statistics = await this.prisma.investmentStatistics.findMany({
      where: { contractId, year },
      orderBy: { month: 'asc' },
    });

    const totalRent = statistics.reduce((sum, stat) => sum + stat.rentReceived, 0);
    const totalExpenses = statistics.reduce(
      (sum, stat) => sum + stat.totalExpenses,
      0,
    );
    const totalProfit = statistics.reduce((sum, stat) => sum + stat.netProfit, 0);

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    const contractValue = contract?.contractValue || 0;
    const annualRoi =
      contractValue > 0
        ? (totalProfit / contractValue) * 100
        : 0;

    return {
      year,
      monthsTracked: statistics.length,
      totalRentReceived: totalRent,
      totalExpenses,
      totalNetProfit: totalProfit,
      annualRoi,
      monthlyBreakdown: statistics,
    };
  }

  /**
   * Delete statistics entry
   */
  async remove(id: string) {
    const statistics = await this.prisma.investmentStatistics.findUnique({
      where: { id },
    });

    if (!statistics) {
      throw new NotFoundException(`Statistics with ID ${id} not found`);
    }

    await this.prisma.investmentStatistics.delete({
      where: { id },
    });

    // Recalculate cumulative values for all subsequent months
    await this.recalculateCumulatives(statistics.contractId, statistics.year, statistics.month);

    return { message: 'Statistics deleted successfully' };
  }

  /**
   * Recalculate cumulative values after deletion or update
   */
  private async recalculateCumulatives(
    contractId: string,
    fromYear: number,
    fromMonth: number,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) return;

    const contractValue = contract.contractValue || 0;

    // Get all statistics from the specified point onwards
    const statistics = await this.prisma.investmentStatistics.findMany({
      where: {
        contractId,
        OR: [
          { year: { gt: fromYear } },
          { year: fromYear, month: { gte: fromMonth } },
        ],
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    // Get previous cumulative value
    const previousStats = await this.prisma.investmentStatistics.findFirst({
      where: {
        contractId,
        OR: [
          { year: fromYear, month: { lt: fromMonth } },
          { year: { lt: fromYear } },
        ],
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    let cumulativeProfit = previousStats?.cumulativeProfit || 0;

    // Update each record with recalculated cumulative values
    for (const stat of statistics) {
      cumulativeProfit += stat.netProfit;
      const cumulativeRoi =
        contractValue > 0
          ? (cumulativeProfit / contractValue) * 100
          : 0;

      await this.prisma.investmentStatistics.update({
        where: { id: stat.id },
        data: {
          cumulativeProfit,
          cumulativeRoi,
        },
      });
    }
  }

  /**
   * Generate statistics for current month (to be called by cron job)
   */
  async generateCurrentMonthStatistics(contractId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: {
          include: {
            tenantLeases: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const activeLease = contract.property.tenantLeases[0];

    // Calculate days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysOccupied = activeLease ? daysInMonth : 0;
    const daysVacant = daysInMonth - daysOccupied;

    // Auto-generate basic statistics
    const dto: CreateInvestmentStatisticsDto = {
      contractId,
      tenantLeaseId: activeLease?.id,
      month,
      year,
      rentReceived: activeLease ? activeLease.monthlyRent : 0,
      serviceCharge: 0, // To be filled manually or from property settings
      maintenanceCost: 0, // To be filled manually
      otherExpenses: 0, // To be filled manually
      daysOccupied,
      daysVacant,
      wasVacant: !activeLease,
    };

    return this.createMonthlyStatistics(dto);
  }
}
