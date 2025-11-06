import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum StatisticsPeriod {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class GetStatisticsQueryDto {
  @ApiProperty({
    enum: StatisticsPeriod,
    required: false,
    default: StatisticsPeriod.MONTH,
    description: 'Time period for statistics aggregation',
  })
  @IsEnum(StatisticsPeriod)
  @IsOptional()
  period?: StatisticsPeriod = StatisticsPeriod.MONTH;
}

export class PropertyStatusBreakdownDto {
  @ApiProperty({ description: 'Total number of properties in the system' })
  total: number;

  @ApiProperty({ description: 'Properties with active contracts (sold/invested)' })
  sold: number;

  @ApiProperty({ description: 'Properties available for investment' })
  available: number;

  @ApiProperty({ description: 'Properties that are currently vacant' })
  vacant: number;

  @ApiProperty({ description: 'Properties that are occupied by tenants' })
  occupied: number;

  @ApiProperty({ description: 'Properties that are disabled/hidden' })
  disabled: number;

  @ApiProperty({ description: 'Properties that are enabled/visible' })
  enabled: number;
}

export class PropertyTrendDataDto {
  @ApiProperty({ description: 'Period label (e.g., "Week 1", "Jan 2025")' })
  period: string;

  @ApiProperty({ description: 'Number of properties added in this period' })
  added: number;

  @ApiProperty({ description: 'Number of properties sold in this period' })
  sold: number;

  @ApiProperty({ description: 'Number of properties that became vacant' })
  vacanciesCreated: number;

  @ApiProperty({ description: 'Total available properties at end of period' })
  availableAtEnd: number;
}

export class InvestmentMetricsDto {
  @ApiProperty({ description: 'Total value of all active contracts' })
  totalInvestedValue: number;

  @ApiProperty({ description: 'Average contract value' })
  averageContractValue: number;

  @ApiProperty({ description: 'Number of active contracts' })
  activeContracts: number;

  @ApiProperty({ description: 'Number of pending contracts' })
  pendingContracts: number;

  @ApiProperty({ description: 'Number of completed contracts' })
  completedContracts: number;

  @ApiProperty({ description: 'Average ROI percentage across active investments' })
  averageRoi: number;

  @ApiProperty({ description: 'Total profit generated (from statistics)' })
  totalProfit: number;
}

export class RecentActivityDto {
  @ApiProperty({ description: 'Recently added properties (last 7 days)' })
  recentlyAdded: number;

  @ApiProperty({ description: 'Recently sold properties (last 7 days)' })
  recentlySold: number;

  @ApiProperty({ description: 'Recently disabled properties (last 7 days)' })
  recentlyDisabled: number;

  @ApiProperty({ description: 'New contracts created (last 7 days)' })
  newContracts: number;

  @ApiProperty({ description: 'Appointments scheduled (last 7 days)' })
  newAppointments: number;
}

export class OccupancyMetricsDto {
  @ApiProperty({ description: 'Current occupancy rate (percentage)' })
  occupancyRate: number;

  @ApiProperty({ description: 'Number of properties with active tenant leases' })
  occupiedProperties: number;

  @ApiProperty({ description: 'Number of vacant properties' })
  vacantProperties: number;

  @ApiProperty({ description: 'Average days vacant across all properties' })
  averageDaysVacant: number;

  @ApiProperty({ description: 'Total number of active tenant leases' })
  activeTenantLeases: number;
}

export class PropertyStatisticsOverviewDto {
  @ApiProperty({ type: PropertyStatusBreakdownDto })
  breakdown: PropertyStatusBreakdownDto;

  @ApiProperty({ type: InvestmentMetricsDto })
  investments: InvestmentMetricsDto;

  @ApiProperty({ type: OccupancyMetricsDto })
  occupancy: OccupancyMetricsDto;

  @ApiProperty({ type: RecentActivityDto })
  recentActivity: RecentActivityDto;

  @ApiProperty({ description: 'Timestamp of when statistics were generated' })
  generatedAt: Date;
}

export class PropertyTrendStatisticsDto {
  @ApiProperty({ description: 'Time period used for trend data' })
  period: StatisticsPeriod;

  @ApiProperty({ type: [PropertyTrendDataDto] })
  trends: PropertyTrendDataDto[];

  @ApiProperty({ description: 'Summary totals across all periods' })
  summary: {
    totalAdded: number;
    totalSold: number;
    totalVacancies: number;
    netChange: number; // added - sold
  };

  @ApiProperty({ description: 'Timestamp of when statistics were generated' })
  generatedAt: Date;
}
