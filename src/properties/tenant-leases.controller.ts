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
import { TenantLeasesService } from './services/tenant-leases.service';
import {
  CreateTenantLeaseDto,
  UpdateTenantLeaseDto,
  TenantLeaseQueryDto,
  TerminateTenantLeaseDto,
} from './dto/tenant-lease.dto';

@ApiTags('Tenant Leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenant-leases')
export class TenantLeasesController {
  constructor(private readonly tenantLeasesService: TenantLeasesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new tenant lease',
    description: 'Creates a new tenant lease and automatically updates property vacancy status. Validates for overlapping active leases.'
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant lease created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or overlapping lease' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async create(@Body() dto: CreateTenantLeaseDto) {
    return this.tenantLeasesService.create(dto);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get all leases for a specific property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'List of tenant leases for the property',
  })
  async findByProperty(@Param('propertyId') propertyId: string) {
    return this.tenantLeasesService.findByProperty(propertyId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active tenant leases' })
  @ApiResponse({
    status: 200,
    description: 'List of all active tenant leases',
  })
  async findAllActive() {
    return this.tenantLeasesService.findAllActive();
  }

  @Get('expiring')
  @ApiOperation({ 
    summary: 'Get leases expiring soon',
    description: 'Returns active leases that will expire within the specified number of days (default: 30 days)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of leases expiring within the specified timeframe',
  })
  async findExpiringLeases(@Query() query: TenantLeaseQueryDto) {
    const daysAhead = query.daysAhead || 30;
    return this.tenantLeasesService.findExpiringLeases(daysAhead);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tenant lease by ID' })
  @ApiParam({ name: 'id', description: 'Tenant Lease ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant lease details',
  })
  @ApiResponse({ status: 404, description: 'Tenant lease not found' })
  async findOne(@Param('id') id: string) {
    return this.tenantLeasesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update a tenant lease',
    description: 'Updates lease details. Validates for overlapping leases if dates are changed. Automatically updates property vacancy if lease status changes.'
  })
  @ApiParam({ name: 'id', description: 'Tenant Lease ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant lease updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or overlapping lease' })
  @ApiResponse({ status: 404, description: 'Tenant lease not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantLeaseDto) {
    return this.tenantLeasesService.update(id, dto);
  }

  @Post(':id/terminate')
  @ApiOperation({ 
    summary: 'Terminate a lease early',
    description: 'Marks lease as inactive, sets terminatedEarly flag, and updates property vacancy status'
  })
  @ApiParam({ name: 'id', description: 'Tenant Lease ID' })
  @ApiResponse({
    status: 200,
    description: 'Lease terminated successfully',
  })
  @ApiResponse({ status: 404, description: 'Tenant lease not found' })
  async terminate(
    @Param('id') id: string,
    @Body() dto: TerminateTenantLeaseDto,
  ) {
    return this.tenantLeasesService.terminate(id, dto.reason);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete a tenant lease',
    description: 'Permanently deletes a tenant lease record and automatically updates property vacancy status'
  })
  @ApiParam({ name: 'id', description: 'Tenant Lease ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant lease deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Tenant lease not found' })
  async remove(@Param('id') id: string) {
    return this.tenantLeasesService.remove(id);
  }
}
