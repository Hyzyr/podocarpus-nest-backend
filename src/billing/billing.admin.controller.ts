import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/auth/roles';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import {
  BillingPlanDto,
  BillingSubscriptionDto,
  CreateBillingPlanDto,
  UpdateBillingPlanDto,
} from './dto/billing.dto';

@ApiTags('admin-billing')
@ApiBearerAuth()
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class BillingAdminController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'List all billing plans [AdminOnly]',
    description:
      'Returns active and inactive subscription plans including provider IDs used to create Stripe/PayPal recurring subscriptions.',
  })
  @ApiResponse({ status: 200, type: [BillingPlanDto] })
  getPlans() {
    return this.billingService.getAdminPlans();
  }

  @Post('plans')
  @ApiOperation({
    summary: 'Create billing plan [AdminOnly]',
    description:
      'Creates an app subscription plan. Price is stored in minor units. Add stripePriceId and/or paypalPlanId after creating matching recurring prices/plans in provider dashboards.',
  })
  @ApiResponse({ status: 201, type: BillingPlanDto })
  createPlan(@Body() dto: CreateBillingPlanDto) {
    return this.billingService.createPlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update billing plan [AdminOnly]' })
  @ApiParam({ name: 'id', description: 'Billing plan ID' })
  @ApiResponse({ status: 200, type: BillingPlanDto })
  updatePlan(@Param('id') id: string, @Body() dto: UpdateBillingPlanDto) {
    return this.billingService.updatePlan(id, dto);
  }

  @Get('subscriptions')
  @ApiOperation({
    summary: 'List app subscriptions [AdminOnly]',
    description:
      'Operational view of user app subscriptions. This is separate from manual tenant/property rent payments in the payments module.',
  })
  @ApiResponse({ status: 200, type: [BillingSubscriptionDto] })
  getSubscriptions() {
    return this.billingService.getAdminSubscriptions();
  }
}
