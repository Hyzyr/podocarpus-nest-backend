import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppUser, BillingPlan } from '@prisma/client';
import Stripe from 'stripe';

export interface ProviderCheckoutSession {
  providerSessionId: string;
  checkoutUrl: string | null;
  providerCustomerId?: string | null;
}

@Injectable()
export class StripeBillingProvider {
  private stripe?: Stripe.Stripe;

  constructor(private readonly config: ConfigService) {}

  async createCheckoutSession(args: {
    plan: BillingPlan;
    user: Pick<AppUser, 'id' | 'email'>;
  }): Promise<ProviderCheckoutSession> {
    if (!args.plan.stripePriceId) {
      throw new BadRequestException(
        'This billing plan is not configured for Stripe.',
      );
    }

    const session = await this.client.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: args.plan.stripePriceId, quantity: 1 }],
      customer_email: args.user.email,
      client_reference_id: args.user.id,
      success_url: this.successUrl,
      cancel_url: this.cancelUrl,
      metadata: {
        userId: args.user.id,
        planId: args.plan.id,
      },
      subscription_data: {
        metadata: {
          userId: args.user.id,
          planId: args.plan.id,
        },
      },
    });

    return {
      providerSessionId: session.id,
      checkoutUrl: session.url,
      providerCustomerId: this.toId(session.customer),
    };
  }

  async createPortalSession(customerId: string, returnUrl?: string) {
    const session = await this.client.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || this.portalReturnUrl,
    });

    return { url: session.url };
  }

  async cancelAtPeriodEnd(providerSubscriptionId: string) {
    return this.client.subscriptions.update(providerSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async retrieveSubscription(providerSubscriptionId: string) {
    return this.client.subscriptions.retrieve(providerSubscriptionId);
  }

  constructWebhookEvent(rawBody: string | Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'STRIPE_WEBHOOK_SECRET is not configured.',
      );
    }

    return this.client.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }

  private get client() {
    if (!this.stripe) {
      const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new ServiceUnavailableException(
          'STRIPE_SECRET_KEY is not configured.',
        );
      }
      this.stripe = new Stripe(secretKey);
    }

    return this.stripe;
  }

  private get successUrl() {
    return (
      this.config.get<string>('BILLING_SUCCESS_URL') ||
      'http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}'
    );
  }

  private get cancelUrl() {
    return (
      this.config.get<string>('BILLING_CANCEL_URL') ||
      'http://localhost:3000/billing/cancel'
    );
  }

  private get portalReturnUrl() {
    return (
      this.config.get<string>('BILLING_PORTAL_RETURN_URL') ||
      'http://localhost:3000/account/billing'
    );
  }

  private toId(value: string | { id: string } | null) {
    if (!value) return null;
    return typeof value === 'string' ? value : value.id;
  }
}
