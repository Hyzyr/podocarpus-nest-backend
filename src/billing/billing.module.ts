import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { BillingAdminController } from './billing.admin.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingWebhooksController } from './billing.webhooks.controller';
import { PaypalBillingProvider } from './providers/paypal-billing.provider';
import { StripeBillingProvider } from './providers/stripe-billing.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [
    BillingController,
    BillingAdminController,
    BillingWebhooksController,
  ],
  providers: [BillingService, StripeBillingProvider, PaypalBillingProvider],
  exports: [BillingService],
})
export class BillingModule {}
