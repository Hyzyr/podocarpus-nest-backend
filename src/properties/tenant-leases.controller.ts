import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { ApiErrorDto } from 'src/common/http/api-response.dto';
import { RentScheduleService } from 'src/payments/services/rent-schedule.service';
import {
  CustomInstallmentDto,
  GenerateScheduleDto,
} from 'src/payments/dto/rent-schedule.dto';
import {
  LeaseScheduleDto,
  RentInstallmentDto,
} from 'src/payments/dto/rent-schedule.response.dto';
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
  constructor(
    private readonly tenantLeasesService: TenantLeasesService,
    private readonly scheduleService: RentScheduleService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new tenant lease',
    description:
      'Creates a tenant lease, updates property vacancy, and rejects overlapping active leases. Pass `paymentSchedule` to set the rent collection dates at the same time — pick a cadence and the due dates and amounts are derived from the lease term, or use CUSTOM and supply the dates. It is optional: leave it out and assign the schedule later with PUT /tenant-leases/{id}/schedule.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant lease created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or overlapping lease',
  })
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
    description:
      'Returns active leases that will expire within the specified number of days (default: 30 days)',
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
    description:
      'Updates lease details. Validates for overlapping leases if dates are changed. Automatically updates property vacancy if lease status changes.',
  })
  @ApiParam({ name: 'id', description: 'Tenant Lease ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant lease updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or overlapping lease',
  })
  @ApiResponse({ status: 404, description: 'Tenant lease not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantLeaseDto) {
    return this.tenantLeasesService.update(id, dto);
  }

  @Post(':id/terminate')
  @ApiOperation({
    summary: 'Terminate a lease early',
    description:
      'Marks lease as inactive, sets terminatedEarly flag, and updates property vacancy status',
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
    description:
      'Permanently deletes a tenant lease record and automatically updates property vacancy status',
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

  /* ------------------------- collection schedule ------------------------- */

  @Get(':id/schedule')
  @ApiOperation({
    summary: 'Get the rent collection schedule for a lease',
    description:
      'Every scheduled collection with its balance and overdue flag, plus a roll-up (scheduled, collected, outstanding, overdue, next due). `paymentFrequency` is derived from the due-date gaps: null = no schedule yet, CUSTOM = hand-made/uneven dates.',
  })
  @ApiParam({ name: 'id', description: 'Tenant Lease ID' })
  @ApiOkResponse({ type: LeaseScheduleDto })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Tenant lease not found',
  })
  async getSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.getSchedule(id);
  }

  @Put(':id/schedule')
  // Rewriting when money is collected is an admin decision, so this is
  // role-gated even though reading the schedule is not.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Set or replace the rent collection schedule',
    description:
      'Generates the due dates for a lease. ANNUAL = 1 collection a year, SEMI_ANNUAL = 2, QUARTERLY = 4, BI_MONTHLY = 6, MONTHLY = 12; CUSTOM takes your own list of dates. Amounts split the annual rent evenly across each 12-month cycle, with the last installment of a cycle absorbing the rounding remainder. The cadence is an input, not stored state — the generated due dates ARE the schedule, and the `paymentFrequency` in the response is derived back from their gaps. Replacing a schedule that already has payments against it requires `force: true` — those payments are kept but become unscheduled.',
  })
  @ApiParam({ name: 'id', description: 'Tenant Lease ID' })
  @ApiOkResponse({ type: LeaseScheduleDto })
  @ApiResponse({
    status: 400,
    type: ApiErrorDto,
    description: 'Nothing to base the amounts on, or no dates produced',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Tenant lease not found',
  })
  @ApiResponse({
    status: 409,
    type: ApiErrorDto,
    description: 'Schedule already has payments; re-send with force: true',
  })
  async setSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateScheduleDto,
  ) {
    return this.scheduleService.generate(id, dto);
  }

  @Post(':id/schedule/installments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Add one extra collection date',
    description:
      'Appends a single due date to an existing schedule without regenerating it — for a renewal month, a late fee, or a one-off split.',
  })
  @ApiParam({ name: 'id', description: 'Tenant Lease ID' })
  @ApiCreatedResponse({ type: RentInstallmentDto })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Tenant lease not found',
  })
  async addInstallment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CustomInstallmentDto,
  ) {
    return this.scheduleService.addInstallment(id, dto);
  }
}
