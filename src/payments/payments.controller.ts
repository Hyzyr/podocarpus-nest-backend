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
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from 'src/common/decorators/user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new rent payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded' })
  @ApiResponse({ status: 404, description: 'Tenant lease not found' })
  async create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.paymentsService.create(dto, user.userId);
  }

  @Get('collection-tracker')
  @ApiOperation({ summary: 'Get collection tracker for a year' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Collection tracker data' })
  async collectionTracker(@Query('year', ParseIntPipe) year: number) {
    return this.paymentsService.getCollectionTracker(year);
  }

  @Get('lease/:leaseId')
  @ApiOperation({ summary: 'List payments for a lease' })
  @ApiParam({ name: 'leaseId', description: 'Tenant Lease ID' })
  @ApiResponse({ status: 200, description: 'Payments list' })
  async findByLease(@Param('leaseId', ParseUUIDPipe) leaseId: string) {
    return this.paymentsService.findByLease(leaseId);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'List payments for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Payments list' })
  async findByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.paymentsService.findByProperty(propertyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment updated' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment deleted' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
