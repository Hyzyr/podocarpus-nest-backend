import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { BillingService } from './billing.service';
import { BillingWebhookResponseDto } from './dto/billing.dto';

type RawBodyRequest = FastifyRequest & { rawBody?: Buffer | string };

@ApiTags('billing-webhooks')
@Controller('billing/webhooks')
export class BillingWebhooksController {
  constructor(private readonly billingService: BillingService) {}

  @Post('stripe')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Stripe billing webhook',
    description:
      'Public endpoint for Stripe webhook delivery. Signature is verified with STRIPE_WEBHOOK_SECRET and events are stored idempotently before processing.',
  })
  @ApiResponse({ status: 200, type: BillingWebhookResponseDto })
  handleStripeWebhook(
    @Req() request: RawBodyRequest,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature)
      throw new BadRequestException('Missing Stripe signature header.');
    const rawBody = request.rawBody ?? JSON.stringify(request.body ?? {});
    return this.billingService.handleStripeWebhook(rawBody, signature);
  }

  @Post('paypal')
  @HttpCode(200)
  @ApiOperation({
    summary: 'PayPal billing webhook',
    description:
      'Public endpoint for PayPal subscription webhooks. If PAYPAL_WEBHOOK_ID is configured, the webhook signature is verified through PayPal before processing.',
  })
  @ApiBody({ description: 'PayPal webhook payload' })
  @ApiResponse({ status: 200, type: BillingWebhookResponseDto })
  handlePaypalWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
  ) {
    return this.billingService.handlePaypalWebhook({ headers, body });
  }
}
