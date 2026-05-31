import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BillingProvider } from '@prisma/client';
import { Roles, RolesGuard } from 'src/auth/roles';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import {
  BillingCheckoutResponseDto,
  BillingInvoiceDto,
  BillingPlanDto,
  BillingPortalResponseDto,
  BillingSubscriptionDto,
  CancelSubscriptionDto,
  CreateBillingCheckoutDto,
  CreateBillingPortalDto,
} from './dto/billing.dto';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'List active subscription plans',
    description:
      'Public endpoint. Returns active app subscription plans for paid features. Provider price IDs are hidden from public responses.',
  })
  @ApiResponse({ status: 200, type: [BillingPlanDto] })
  getPlans() {
    return this.billingService.getPublicPlans();
  }

  @Get('me/subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investor', 'broker', 'admin', 'superadmin')
  @ApiOperation({
    summary: 'Get current user subscription',
    description:
      'Returns the current user subscription, plan, provider, status, start/end dates, and cancellation state. Returns null if no subscription exists.',
  })
  @ApiResponse({ status: 200, type: BillingSubscriptionDto })
  getMySubscription(@CurrentUser() user: CurrentUser) {
    return this.billingService.getCurrentSubscription(user.userId);
  }

  @Get('me/invoices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investor', 'broker', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Get current user billing invoices' })
  @ApiResponse({ status: 200, type: [BillingInvoiceDto] })
  getMyInvoices(@CurrentUser() user: CurrentUser) {
    return this.billingService.getUserInvoices(user.userId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investor', 'broker', 'admin', 'superadmin')
  @ApiOperation({
    summary: 'Create subscription checkout',
    description:
      'Creates a Stripe Checkout Session or PayPal approval flow for an active billing plan. Frontend redirects the user to checkoutUrl to enter payment information. Subscription is activated only by verified provider webhooks.',
  })
  @ApiBody({
    type: CreateBillingCheckoutDto,
    examples: {
      stripe: {
        value: { provider: BillingProvider.stripe, planId: 'plan-uuid' },
      },
      paypal: {
        value: { provider: BillingProvider.paypal, planId: 'plan-uuid' },
      },
    },
  })
  @ApiResponse({ status: 201, type: BillingCheckoutResponseDto })
  createCheckout(
    @CurrentUser() user: CurrentUser,
    @Body() dto: CreateBillingCheckoutDto,
  ) {
    return this.billingService.createCheckout(user.userId, dto);
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investor', 'broker', 'admin', 'superadmin')
  @ApiOperation({
    summary: 'Create billing portal session',
    description:
      'Creates a provider-hosted payment management portal. Stripe users can update payment method, view invoices, and manage billing details without card data touching this backend.',
  })
  @ApiResponse({ status: 201, type: BillingPortalResponseDto })
  createPortal(
    @CurrentUser() user: CurrentUser,
    @Body() dto: CreateBillingPortalDto,
  ) {
    return this.billingService.createPortal(user.userId, dto);
  }

  @Post('cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investor', 'broker', 'admin', 'superadmin')
  @ApiOperation({
    summary: 'Cancel current subscription',
    description:
      'Cancels the current user subscription. Stripe cancellation is scheduled at period end; PayPal cancellation is immediate because PayPal does not support the same period-end cancellation semantics.',
  })
  @ApiResponse({ status: 200, type: BillingSubscriptionDto })
  cancelSubscription(
    @CurrentUser() user: CurrentUser,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.billingService.cancelSubscription(user.userId, dto);
  }
}
