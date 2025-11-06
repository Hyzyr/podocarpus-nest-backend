import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { PropertiesStatisticsService } from './services/properties.statistics.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import {
  PropertyStatisticsOverviewDto,
  PropertyTrendStatisticsDto,
  GetStatisticsQueryDto,
} from './dto/property.statistics.dto';

@ApiTags('properties-statistics')
@Controller('properties/statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class PropertiesStatisticsController {
  constructor(
    private readonly statisticsService: PropertiesStatisticsService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get comprehensive property statistics overview [AdminOnly]',
    description:
      'Returns breakdown of property statuses, investment metrics, occupancy rates, and recent activity',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: PropertyStatisticsOverviewDto,
  })
  getOverview() {
    return this.statisticsService.getOverview();
  }

  @Get('trends')
  @ApiOperation({
    summary: 'Get property trend statistics [AdminOnly]',
    description:
      'Returns time-series data showing properties added, sold, and vacancies over time. Supports weekly, monthly, quarterly, and yearly periods.',
  })
  @ApiResponse({
    status: 200,
    description: 'Trend statistics retrieved successfully',
    type: PropertyTrendStatisticsDto,
  })
  getTrends(@Query() query: GetStatisticsQueryDto) {
    return this.statisticsService.getTrends(query.period!);
  }
}
