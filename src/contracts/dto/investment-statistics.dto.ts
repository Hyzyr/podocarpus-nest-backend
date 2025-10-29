import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateInvestmentStatisticsDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsString()
  contractId: string;

  @ApiPropertyOptional({ description: 'Tenant Lease ID (if applicable)' })
  @IsOptional()
  @IsString()
  tenantLeaseId?: string;

  @ApiProperty({ description: 'Month (1-12)', example: 10, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Year', example: 2025 })
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiPropertyOptional({ description: 'Rent received this month', example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rentReceived?: number;

  @ApiPropertyOptional({ description: 'Service charge for the month', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  serviceCharge?: number;

  @ApiPropertyOptional({ description: 'Maintenance cost', example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maintenanceCost?: number;

  @ApiPropertyOptional({ description: 'Other expenses', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherExpenses?: number;

  @ApiPropertyOptional({ description: 'Total expenses (calculated)', example: 800 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalExpenses?: number;

  @ApiPropertyOptional({ description: 'Net profit (calculated)', example: 4200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  netProfit?: number;

  @ApiPropertyOptional({ description: 'ROI percentage (calculated)', example: 0.84 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  roiPercentage?: number;

  @ApiPropertyOptional({ description: 'Cumulative profit to date', example: 42000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cumulativeProfit?: number;

  @ApiPropertyOptional({ description: 'Cumulative ROI percentage', example: 8.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cumulativeRoi?: number;

  @ApiPropertyOptional({ description: 'Days property was occupied', example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  daysOccupied?: number;

  @ApiPropertyOptional({ description: 'Days property was vacant', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  daysVacant?: number;

  @ApiPropertyOptional({ description: 'Was property vacant this month?', example: false })
  @IsOptional()
  @IsBoolean()
  wasVacant?: boolean;
}

export class UpdateInvestmentStatisticsDto extends PartialType(CreateInvestmentStatisticsDto) {}

export class InvestmentStatisticsParamDto {
  @ApiProperty({ description: 'Investment Statistics ID' })
  @IsString()
  id: string;
}

export class ContractStatisticsQueryDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsString()
  contractId: string;

  @ApiPropertyOptional({ description: 'Start year', example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startYear?: number;

  @ApiPropertyOptional({ description: 'Start month (1-12)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({ description: 'End year', example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endYear?: number;

  @ApiPropertyOptional({ description: 'End month (1-12)', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number;
}

export class RoiChartDataDto {
  @ApiProperty({ description: 'Month' })
  month: number;

  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'ROI percentage for this month' })
  roiPercentage: number;

  @ApiProperty({ description: 'Cumulative ROI up to this month' })
  cumulativeRoi: number;

  @ApiProperty({ description: 'Net profit for this month' })
  netProfit: number;

  @ApiProperty({ description: 'Cumulative profit up to this month' })
  cumulativeProfit: number;

  @ApiPropertyOptional({ description: 'Tenant name if applicable' })
  tenantName?: string;
}

export class InvestmentSummaryDto {
  @ApiProperty({ description: 'Total months tracked' })
  totalMonths: number;

  @ApiProperty({ description: 'Average monthly ROI percentage' })
  averageMonthlyRoi: number;

  @ApiProperty({ description: 'Total cumulative profit' })
  totalProfit: number;

  @ApiProperty({ description: 'Total cumulative ROI percentage' })
  totalRoi: number;

  @ApiProperty({ description: 'Total income received' })
  totalIncome: number;

  @ApiProperty({ description: 'Total expenses' })
  totalExpenses: number;

  @ApiProperty({ description: 'Total days occupied' })
  totalDaysOccupied: number;

  @ApiProperty({ description: 'Total days vacant' })
  totalDaysVacant: number;

  @ApiProperty({ description: 'Occupancy rate percentage' })
  occupancyRate: number;
}
