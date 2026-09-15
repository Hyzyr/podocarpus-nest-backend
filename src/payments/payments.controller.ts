import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from 'src/common/decorators/user.decorator';
import {
  ActionResponseDto,
  ApiErrorDto,
  PaginatedDto,
  paginatedSchema,
} from 'src/common/http/api-response.dto';
import { PaymentsService } from './services/payments.service';
import { RentScheduleService } from './services/rent-schedule.service';
import { PaymentsDashboardService } from './services/payments-dashboard.service';
import { PaymentsMonthlyService } from './services/payments-monthly.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { MonthlyViewQueryDto } from './dto/monthly-view.dto';
import { MonthlyViewDto } from './dto/monthly-view.response.dto';
import {
  CollectInstallmentDto,
  InstallmentQueryDto,
  PaymentsDashboardQueryDto,
  UpdateInstallmentDto,
} from './dto/rent-schedule.dto';
import {
  CollectResultDto,
  PaymentsDashboardDto,
  RentInstallmentDto,
  RentPaymentDto,
} from './dto/rent-schedule.response.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@ApiExtraModels(PaginatedDto, RentInstallmentDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly scheduleService: RentScheduleService,
    private readonly dashboardService: PaymentsDashboardService,
    private readonly monthlyService: PaymentsMonthlyService,
  ) {}

  /* ------------------------------ dashboard ------------------------------ */

  @Get('dashboard')
  @ApiOperation({
    summary: 'Collection dashboard: collected, upcoming and overdue',
    description: [
      'Everything the admin rent dashboard needs in one call.',
      '',
      'Totals are anchored on the schedule: `scheduled` is what is due in the window,',
      '`collectedScheduled` is money received against those same installments, and',
      '`collectedAdHoc` is money received in the window with no installment attached.',
      '',
      '`upcoming` and `overdue` are evaluated against **now**, not the window, because',
      'they answer "what needs chasing today".',
    ].join('\n'),
  })
  @ApiOkResponse({ type: PaymentsDashboardDto })
  async dashboard(@Query() query: PaymentsDashboardQueryDto) {
    return this.dashboardService.getDashboard(query);
  }

  @Get('monthly')
  @ApiOperation({
    summary: 'Month-by-month collection table (tenants x months)',
    description: [
      'The rent-roll grid: one row per tenant, one cell per month, pre-bucketed server-side.',
      '',
      '`months` is the column header row and `rows[].cells` lines up with it index-for-index —',
      'never sparse, so the table renders with no client-side bucketing.',
      '',
      'Each column is flagged `isPast` / `isCurrent` / `isFuture`. Past months are history:',
      'read `payments` for the full record of what arrived. Current and future months are',
      'expectations: read `status` and `balance` for what is still owed.',
      '',
      'A cell answers two different questions and they are not the same number —',
      '`amountDue`/`amountPaid` describe what was **owed for** that month, while',
      '`receivedInMonth`/`payments` describe what **arrived during** it. A tenant paying',
      "January's rent in March raises January's `amountPaid` and March's `receivedInMonth`.",
    ].join('\n'),
  })
  @ApiOkResponse({ type: MonthlyViewDto })
  async monthly(@Query() query: MonthlyViewQueryDto) {
    return this.monthlyService.getMonthlyView(query);
  }

  @Get('collection-tracker')
  @ApiOperation({
    summary: 'Per-unit collection table for a year',
    description:
      'One row per enabled property. Leases with a generated schedule report against it; older leases fall back to annualRent.',
  })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2026 })
  @ApiResponse({ status: 200, description: 'Collection tracker data' })
  async collectionTracker(@Query('year', ParseIntPipe) year: number) {
    return this.paymentsService.getCollectionTracker(year);
  }

  /* ----------------------------- installments ---------------------------- */

  @Get('installments')
  @ApiOperation({
    summary: 'List scheduled collections across leases',
    description:
      'The dashboard drill-down. Filter by lease, property, status or due-date window; `overdueOnly=true` returns unsettled installments whose due date has passed.',
  })
  @ApiOkResponse({ schema: paginatedSchema('RentInstallmentDto') })
  async listInstallments(@Query() query: InstallmentQueryDto) {
    return this.scheduleService.listInstallments(query);
  }

  @Get('installments/:id')
  @ApiOperation({ summary: 'Get one scheduled collection with its payments' })
  @ApiParam({ name: 'id', description: 'Installment ID' })
  @ApiOkResponse({ type: RentInstallmentDto })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Installment not found',
  })
  async findInstallment(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.findInstallment(id);
  }

  @Post('installments/:id/collect')
  @ApiOperation({
    summary: 'Accept payment for a scheduled collection',
    description:
      'Records the money and re-derives the installment status. The amount defaults to the outstanding balance, so settling in full needs no body. Partial amounts leave the installment PARTIAL.',
  })
  @ApiParam({ name: 'id', description: 'Installment ID' })
  @ApiCreatedResponse({ type: CollectResultDto })
  @ApiResponse({
    status: 400,
    type: ApiErrorDto,
    description: 'Already settled, or amount <= 0',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Installment not found',
  })
  @ApiResponse({
    status: 409,
    type: ApiErrorDto,
    description: 'Installment is cancelled',
  })
  async collect(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CollectInstallmentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.scheduleService.collect(id, dto, user.userId);
  }

  @Patch('installments/:id')
  @ApiOperation({
    summary: 'Edit a scheduled collection',
    description:
      'Move the due date, change the amount, add a note, or waive/cancel it. PAID and PARTIAL are derived from payments and cannot be set here.',
  })
  @ApiParam({ name: 'id', description: 'Installment ID' })
  @ApiOkResponse({ type: RentInstallmentDto })
  @ApiResponse({
    status: 400,
    type: ApiErrorDto,
    description: 'Status is not settable by hand',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Installment not found',
  })
  async updateInstallment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstallmentDto,
  ) {
    return this.scheduleService.updateInstallment(id, dto);
  }

  @Delete('installments/:id')
  @ApiOperation({
    summary: 'Remove a scheduled collection',
    description:
      'Payments recorded against it are kept and become unscheduled, so no money record is lost.',
  })
  @ApiParam({ name: 'id', description: 'Installment ID' })
  @ApiOkResponse({ type: ActionResponseDto })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Installment not found',
  })
  async removeInstallment(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.removeInstallment(id);
  }

  /* ------------------------------- payments ------------------------------ */

  @Post()
  @ApiOperation({
    summary: 'Record a custom payment',
    description:
      'For off-schedule or corrective entries. Pass `installmentId` to attach it to a scheduled date; omit it for a standalone collection.',
  })
  @ApiCreatedResponse({ type: RentPaymentDto })
  @ApiResponse({
    status: 400,
    type: ApiErrorDto,
    description: 'Installment belongs to another lease',
  })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Tenant lease or installment not found',
  })
  async create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.paymentsService.create(dto, user.userId);
  }

  @Get('lease/:leaseId')
  @ApiOperation({ summary: 'List payments for a lease' })
  @ApiParam({ name: 'leaseId', description: 'Tenant Lease ID' })
  @ApiOkResponse({ type: [RentPaymentDto] })
  async findByLease(@Param('leaseId', ParseUUIDPipe) leaseId: string) {
    return this.paymentsService.findByLease(leaseId);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'List payments for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiOkResponse({ type: [RentPaymentDto] })
  async findByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.paymentsService.findByProperty(propertyId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Correct a payment',
    description:
      'Re-derives the status of both the old and the new installment, so a correction never leaves a stale PAID behind.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiOkResponse({ type: RentPaymentDto })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Payment not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a payment',
    description: 'The linked installment falls back to PARTIAL or PENDING.',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiOkResponse({ type: ActionResponseDto })
  @ApiResponse({
    status: 404,
    type: ApiErrorDto,
    description: 'Payment not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
