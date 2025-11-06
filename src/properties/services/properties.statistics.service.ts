import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  PropertyStatisticsOverviewDto,
  PropertyTrendStatisticsDto,
  StatisticsPeriod,
  PropertyStatusBreakdownDto,
  InvestmentMetricsDto,
  OccupancyMetricsDto,
  RecentActivityDto,
  PropertyTrendDataDto,
} from '../dto/property.statistics.dto';

@Injectable()
export class PropertiesStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive overview of property statistics
   */
  async getOverview(): Promise<PropertyStatisticsOverviewDto> {
    const [
      breakdown,
      investments,
      occupancy,
      recentActivity,
    ] = await Promise.all([
      this.getPropertyBreakdown(),
      this.getInvestmentMetrics(),
      this.getOccupancyMetrics(),
      this.getRecentActivity(),
    ]);

    return {
      breakdown,
      investments,
      occupancy,
      recentActivity,
      generatedAt: new Date(),
    };
  }

  /**
   * Get property status breakdown
   */
  private async getPropertyBreakdown(): Promise<PropertyStatusBreakdownDto> {
    const [
      total,
      sold,
      available,
      vacant,
      occupied,
      disabled,
      enabled,
    ] = await Promise.all([
      // Total properties
      this.prisma.property.count(),
      
      // Sold (has active contract)
      this.prisma.property.count({
        where: {
          contracts: {
            some: {
              status: {
                in: ['active', 'pending'],
              },
            },
          },
        },
      }),
      
      // Available (no owner, enabled)
      this.prisma.property.count({
        where: {
          ownerId: null,
          isEnabled: true,
        },
      }),
      
      // Vacant properties
      this.prisma.property.count({
        where: { isVacant: true },
      }),
      
      // Occupied properties
      this.prisma.property.count({
        where: { isVacant: false },
      }),
      
      // Disabled properties
      this.prisma.property.count({
        where: { isEnabled: false },
      }),
      
      // Enabled properties
      this.prisma.property.count({
        where: { isEnabled: true },
      }),
    ]);

    return {
      total,
      sold,
      available,
      vacant,
      occupied,
      disabled,
      enabled,
    };
  }

  /**
   * Get investment metrics
   */
  private async getInvestmentMetrics(): Promise<InvestmentMetricsDto> {
    const [
      activeContracts,
      pendingContracts,
      completedContracts,
      contractValues,
      statistics,
    ] = await Promise.all([
      // Active contracts count
      this.prisma.contract.count({
        where: { status: 'active' },
      }),
      
      // Pending contracts count
      this.prisma.contract.count({
        where: { status: 'pending' },
      }),
      
      // Completed contracts count
      this.prisma.contract.count({
        where: { status: 'completed' },
      }),
      
      // Contract values for active contracts
      this.prisma.contract.findMany({
        where: {
          status: { in: ['active', 'pending'] },
          contractValue: { not: null },
        },
        select: { contractValue: true },
      }),
      
      // ROI and profit from investment statistics
      this.prisma.investmentStatistics.aggregate({
        _avg: { roiPercentage: true },
        _sum: { netProfit: true },
      }),
    ]);

    const totalInvestedValue = contractValues.reduce(
      (sum, contract) => sum + (contract.contractValue || 0),
      0,
    );
    
    const averageContractValue = contractValues.length > 0
      ? totalInvestedValue / contractValues.length
      : 0;

    return {
      totalInvestedValue,
      averageContractValue,
      activeContracts,
      pendingContracts,
      completedContracts,
      averageRoi: statistics._avg.roiPercentage || 0,
      totalProfit: Number(statistics._sum.netProfit) || 0,
    };
  }

  /**
   * Get occupancy metrics
   */
  private async getOccupancyMetrics(): Promise<OccupancyMetricsDto> {
    const [
      totalProperties,
      occupiedProperties,
      vacantProperties,
      activeTenantLeases,
      vacancyStats,
    ] = await Promise.all([
      this.prisma.property.count(),
      
      this.prisma.property.count({
        where: { isVacant: false },
      }),
      
      this.prisma.property.count({
        where: { isVacant: true },
      }),
      
      this.prisma.tenantLease.count({
        where: { isActive: true },
      }),
      
      // Get average days vacant from investment statistics
      this.prisma.investmentStatistics.aggregate({
        _avg: { daysVacant: true },
      }),
    ]);

    const occupancyRate = totalProperties > 0
      ? (occupiedProperties / totalProperties) * 100
      : 0;

    return {
      occupancyRate,
      occupiedProperties,
      vacantProperties,
      averageDaysVacant: Math.round(vacancyStats._avg.daysVacant || 0),
      activeTenantLeases,
    };
  }

  /**
   * Get recent activity (last 7 days)
   */
  private async getRecentActivity(): Promise<RecentActivityDto> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      recentlyAdded,
      recentlySold,
      recentlyDisabled,
      newContracts,
      newAppointments,
    ] = await Promise.all([
      // Properties added in last 7 days
      this.prisma.property.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      
      // Contracts signed in last 7 days (properties sold)
      this.prisma.contract.count({
        where: {
          signedDate: { gte: sevenDaysAgo },
          status: { in: ['active', 'pending'] },
        },
      }),
      
      // Properties disabled in last 7 days
      this.prisma.property.count({
        where: {
          isEnabled: false,
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
      
      // New contracts created
      this.prisma.contract.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      
      // New appointments scheduled
      this.prisma.appointment.count({
        where: {
          scheduledAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    return {
      recentlyAdded,
      recentlySold,
      recentlyDisabled,
      newContracts,
      newAppointments,
    };
  }

  /**
   * Get trend statistics based on period (week/month/quarter/year)
   */
  async getTrends(period: StatisticsPeriod): Promise<PropertyTrendStatisticsDto> {
    const periods = this.generatePeriods(period);
    const trends: PropertyTrendDataDto[] = [];

    let totalAdded = 0;
    let totalSold = 0;
    let totalVacancies = 0;

    for (const { start, end, label } of periods) {
      const [added, sold, vacanciesCreated, availableAtEnd] = await Promise.all([
        // Properties added in this period
        this.prisma.property.count({
          where: {
            createdAt: { gte: start, lte: end },
          },
        }),
        
        // Contracts signed (properties sold) in this period
        this.prisma.contract.count({
          where: {
            signedDate: { gte: start, lte: end },
            status: { in: ['active', 'pending'] },
          },
        }),
        
        // Properties that became vacant in this period
        this.prisma.investmentStatistics.count({
          where: {
            createdAt: { gte: start, lte: end },
            wasVacant: true,
          },
        }),
        
        // Available properties at end of period
        this.prisma.property.count({
          where: {
            ownerId: null,
            isEnabled: true,
            createdAt: { lte: end },
          },
        }),
      ]);

      totalAdded += added;
      totalSold += sold;
      totalVacancies += vacanciesCreated;

      trends.push({
        period: label,
        added,
        sold,
        vacanciesCreated,
        availableAtEnd,
      });
    }

    return {
      period,
      trends,
      summary: {
        totalAdded,
        totalSold,
        totalVacancies,
        netChange: totalAdded - totalSold,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Generate time periods for trend analysis
   */
  private generatePeriods(period: StatisticsPeriod): Array<{
    start: Date;
    end: Date;
    label: string;
  }> {
    const now = new Date();
    const periods: Array<{ start: Date; end: Date; label: string }> = [];

    switch (period) {
      case StatisticsPeriod.WEEK:
        // Last 12 weeks
        for (let i = 11; i >= 0; i--) {
          const end = new Date(now);
          end.setDate(end.getDate() - i * 7);
          end.setHours(23, 59, 59, 999);
          
          const start = new Date(end);
          start.setDate(start.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          
          const weekNum = 12 - i;
          periods.push({
            start,
            end,
            label: `Week ${weekNum}`,
          });
        }
        break;

      case StatisticsPeriod.MONTH:
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          end.setHours(23, 59, 59, 999);
          
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          start.setHours(0, 0, 0, 0);
          
          periods.push({
            start,
            end,
            label: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          });
        }
        break;

      case StatisticsPeriod.QUARTER:
        // Last 8 quarters
        for (let i = 7; i >= 0; i--) {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const targetQuarter = currentQuarter - i;
          
          const year = now.getFullYear() + Math.floor(targetQuarter / 4);
          const quarter = ((targetQuarter % 4) + 4) % 4;
          
          const start = new Date(year, quarter * 3, 1);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(year, quarter * 3 + 3, 0);
          end.setHours(23, 59, 59, 999);
          
          periods.push({
            start,
            end,
            label: `Q${quarter + 1} ${year}`,
          });
        }
        break;

      case StatisticsPeriod.YEAR:
        // Last 5 years
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          const start = new Date(year, 0, 1);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(year, 11, 31);
          end.setHours(23, 59, 59, 999);
          
          periods.push({
            start,
            end,
            label: year.toString(),
          });
        }
        break;
    }

    return periods;
  }
}
