import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/auth/roles';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  AdminLandingStatsDto,
  AdminSuccessCaseDto,
  CreateSuccessCaseDto,
  LandingCasesLimitQueryDto,
  LandingEventDto,
  LandingLimitQueryDto,
  LandingPropertyDto,
  LandingQueryDto,
  LandingResponseDto,
  LandingStatsDto,
  LandingSuccessCaseDto,
  SuccessCaseIdParamDto,
  UpdateLandingStatsDto,
  UpdateSuccessCaseDto,
} from './dto/landing.dto';
import { LandingService } from './landing.service';

const PUBLIC_CACHE_CONTROL = 'public, max-age=60, s-maxage=300';

@ApiTags('public-landing')
@Controller('public/landing')
export class PublicLandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get()
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get combined public landing page data',
    description:
      'Public endpoint with no auth required. Returns sanitized landing stats, featured enabled properties, upcoming/open events, and approved success cases. Response is cacheable with Cache-Control: public, max-age=60, s-maxage=300.',
  })
  @ApiQuery({
    name: 'propertiesLimit',
    required: false,
    type: Number,
    example: 4,
    description: 'Max 8. Defaults to 4.',
  })
  @ApiQuery({
    name: 'eventsLimit',
    required: false,
    type: Number,
    example: 4,
    description: 'Max 8. Defaults to 4.',
  })
  @ApiQuery({
    name: 'casesLimit',
    required: false,
    type: Number,
    example: 3,
    description: 'Max 8. Defaults to 3.',
  })
  @ApiResponse({
    status: 200,
    description: 'Landing page data retrieved successfully.',
    type: LandingResponseDto,
  })
  getLanding(@Query() query: LandingQueryDto) {
    return this.landingService.getLanding(query);
  }

  @Get('stats')
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get public landing page statistics',
    description:
      'Public endpoint with no auth required. Returns aggregate metrics only and does not expose user, contract, tenant, or owner records.',
  })
  @ApiResponse({
    status: 200,
    description: 'Landing page statistics retrieved successfully.',
    type: LandingStatsDto,
  })
  getStats() {
    return this.landingService.getPublicStats();
  }

  @Get('properties')
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get public landing page properties',
    description:
      'Public endpoint with no auth required. Returns enabled properties without owners, ordered by featuredRank first and newest second.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 4,
    description: 'Max 8. Defaults to 4.',
  })
  @ApiResponse({
    status: 200,
    description: 'Landing page properties retrieved successfully.',
    type: [LandingPropertyDto],
  })
  getProperties(@Query() query: LandingLimitQueryDto) {
    return this.landingService.getPublicProperties(query.limit);
  }

  @Get('events')
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get public landing page events',
    description:
      'Public endpoint with no auth required. Returns active OPEN or UPCOMING events, sorted by nearest upcoming startsAt.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 4,
    description: 'Max 8. Defaults to 4.',
  })
  @ApiResponse({
    status: 200,
    description: 'Landing page events retrieved successfully.',
    type: [LandingEventDto],
  })
  getEvents(@Query() query: LandingLimitQueryDto) {
    return this.landingService.getPublicEvents(query.limit);
  }

  @Get('success-cases')
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get public landing page success cases',
    description:
      'Public endpoint with no auth required. Returns only success cases where isPublished=true and hasConsent=true.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 3,
    description: 'Max 8. Defaults to 3.',
  })
  @ApiResponse({
    status: 200,
    description: 'Landing page success cases retrieved successfully.',
    type: [LandingSuccessCaseDto],
  })
  getSuccessCases(@Query() query: LandingCasesLimitQueryDto) {
    return this.landingService.getPublicSuccessCases(query.limit);
  }
}

@ApiTags('admin-landing')
@ApiBearerAuth()
@Controller('admin/landing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminLandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get editable landing page statistics [AdminOnly]',
    description:
      'Admin-only endpoint for the editable landing metric overrides used by the public landing response.',
  })
  @ApiResponse({
    status: 200,
    description: 'Landing page statistic settings retrieved successfully.',
    type: AdminLandingStatsDto,
  })
  getStatsSettings() {
    return this.landingService.getStatsSettings();
  }

  @Patch('stats')
  @ApiOperation({
    summary: 'Update editable landing page statistics [AdminOnly]',
    description:
      'Admin-only endpoint. Send only fields that should be overridden. Null clears an override so the public endpoint can fall back to calculated values.',
  })
  @ApiResponse({
    status: 200,
    description: 'Landing page statistic settings updated successfully.',
    type: AdminLandingStatsDto,
  })
  updateStatsSettings(@Body() dto: UpdateLandingStatsDto) {
    return this.landingService.updateStatsSettings(dto);
  }

  @Get('success-cases')
  @ApiOperation({
    summary: 'Get all success cases [AdminOnly]',
    description:
      'Admin-only endpoint for managing testimonial/success-case records before they become public.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success cases retrieved successfully.',
    type: [AdminSuccessCaseDto],
  })
  getSuccessCases() {
    return this.landingService.getAdminSuccessCases();
  }

  @Post('success-cases')
  @ApiOperation({
    summary: 'Create a success case [AdminOnly]',
    description:
      'Admin-only endpoint. A success case is public only when both isPublished and hasConsent are true.',
  })
  @ApiResponse({
    status: 201,
    description: 'Success case created successfully.',
    type: AdminSuccessCaseDto,
  })
  createSuccessCase(@Body() dto: CreateSuccessCaseDto) {
    return this.landingService.createSuccessCase(dto);
  }

  @Patch('success-cases/:id')
  @ApiOperation({
    summary: 'Update a success case [AdminOnly]',
    description:
      'Admin-only endpoint. Use this to publish/unpublish, record consent, change ordering, or edit testimonial content.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success case updated successfully.',
    type: AdminSuccessCaseDto,
  })
  updateSuccessCase(
    @Param() { id }: SuccessCaseIdParamDto,
    @Body() dto: UpdateSuccessCaseDto,
  ) {
    return this.landingService.updateSuccessCase(id, dto);
  }

  @Delete('success-cases/:id')
  @ApiOperation({ summary: 'Delete a success case [AdminOnly]' })
  @ApiResponse({
    status: 200,
    description: 'Success case deleted successfully.',
  })
  deleteSuccessCase(@Param() { id }: SuccessCaseIdParamDto) {
    return this.landingService.deleteSuccessCase(id);
  }
}
