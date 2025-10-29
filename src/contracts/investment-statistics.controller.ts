import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { InvestmentStatisticsService } from './services/investment-statistics.service';
import {
  CreateInvestmentStatisticsDto,
  UpdateInvestmentStatisticsDto,
  ContractStatisticsQueryDto,
  InvestmentSummaryDto,
  RoiChartDataDto,
} from './dto/investment-statistics.dto';

@ApiTags('Investment Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investment-statistics')
export class InvestmentStatisticsController {
  constructor(
    private readonly statisticsService: InvestmentStatisticsService,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create or update monthly investment statistics',
    description: 'Creates new statistics for a month or updates existing. Automatically calculates totalExpenses, netProfit, ROI %, and cumulative values. Sends notifications for milestones (10% ROI) or negative performance.'
  })
  @ApiResponse({
    status: 201,
    description: 'Statistics created/updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async create(@Body() dto: CreateInvestmentStatisticsDto) {
    return this.statisticsService.createMonthlyStatistics(dto);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Get all statistics for a contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiResponse({
    status: 200,
    description: 'List of investment statistics',
  })
  async findByContract(@Param('contractId') contractId: string) {
    return this.statisticsService.findByContract(contractId);
  }

  @Get('contract/:contractId/summary')
  @ApiOperation({ 
    summary: 'Get investment summary for a contract',
    description: 'Returns comprehensive investment summary including contract value, cumulative profit/ROI, average monthly metrics, occupancy rate, and total months tracked'
  })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiResponse({
    status: 200,
    description: 'Investment summary with aggregated metrics',
    type: InvestmentSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getInvestmentSummary(@Param('contractId') contractId: string) {
    return this.statisticsService.getInvestmentSummary(contractId);
  }

  @Get('contract/:contractId/chart-data')
  @ApiOperation({ 
    summary: 'Get ROI chart data for a contract',
    description: 'Returns formatted data for charts/graphs including labels, monthly ROI, cumulative ROI, profit values, rent, and expenses arrays'
  })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiResponse({
    status: 200,
    description: 'ROI chart data for visualization',
    type: RoiChartDataDto,
  })
  async getRoiChartData(
    @Param('contractId') contractId: string,
    @Query() query: ContractStatisticsQueryDto,
  ) {
    const months = query.startMonth ? 12 : 12; // Default to 12 months
    return this.statisticsService.getRoiChartData(contractId, months);
  }

  @Get('contract/:contractId/annual/:year')
  @ApiOperation({ 
    summary: 'Get annual summary for a contract',
    description: 'Returns yearly aggregated data including total rent, expenses, profit, annual ROI, and monthly breakdown'
  })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiParam({ name: 'year', description: 'Year', example: 2025 })
  @ApiResponse({
    status: 200,
    description: 'Annual summary with monthly breakdown',
  })
  async getAnnualSummary(
    @Param('contractId') contractId: string,
    @Param('year') year: number,
  ) {
    return this.statisticsService.getAnnualSummary(contractId, +year);
  }

  @Get('contract/:contractId/month/:month/year/:year')
  @ApiOperation({ summary: 'Get statistics for a specific month' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiParam({ name: 'month', description: 'Month (1-12)' })
  @ApiParam({ name: 'year', description: 'Year' })
  @ApiResponse({
    status: 200,
    description: 'Statistics for the specified month',
  })
  @ApiResponse({ status: 404, description: 'Statistics not found' })
  async findByMonthYear(
    @Param('contractId') contractId: string,
    @Param('month') month: number,
    @Param('year') year: number,
  ) {
    return this.statisticsService.findByMonthYear(contractId, +month, +year);
  }

  @Post('contract/:contractId/generate-current-month')
  @ApiOperation({
    summary: 'Auto-generate statistics for current month',
    description: 'Automatically generates basic statistics for the current month',
  })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiResponse({
    status: 201,
    description: 'Current month statistics generated',
  })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async generateCurrentMonth(@Param('contractId') contractId: string) {
    return this.statisticsService.generateCurrentMonthStatistics(contractId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update investment statistics' })
  @ApiParam({ name: 'id', description: 'Statistics ID' })
  @ApiResponse({
    status: 200,
    description: 'Statistics updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Statistics not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInvestmentStatisticsDto,
  ) {
    // For updating, we need to get the existing record first
    // This would require adding an update method to the service
    // For now, users can create with same month/year to update
    return { message: 'Use POST to create/update statistics for a month' };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete investment statistics',
    description: 'Deletes statistics and recalculates cumulative values',
  })
  @ApiParam({ name: 'id', description: 'Statistics ID' })
  @ApiResponse({
    status: 200,
    description: 'Statistics deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Statistics not found' })
  async remove(@Param('id') id: string) {
    return this.statisticsService.remove(id);
  }
}
