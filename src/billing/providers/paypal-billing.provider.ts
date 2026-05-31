import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppUser, BillingPlan } from '@prisma/client';
import { ProviderCheckoutSession } from './stripe-billing.provider';

type PayPalLink = { href?: string; rel?: string; method?: string };

type PayPalSubscriptionResponse = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
};

type PayPalAccessTokenResponse = {
  access_token?: string;
};

@Injectable()
export class PaypalBillingProvider {
  constructor(private readonly config: ConfigService) {}

  async createCheckoutSession(args: {
    plan: BillingPlan;
    user: Pick<AppUser, 'id' | 'email'>;
  }): Promise<ProviderCheckoutSession> {
    if (!args.plan.paypalPlanId) {
      throw new BadRequestException(
        'This billing plan is not configured for PayPal.',
      );
    }

    const response = await this.request<PayPalSubscriptionResponse>(
      '/v1/billing/subscriptions',
      {
        method: 'POST',
        body: {
          plan_id: args.plan.paypalPlanId,
          custom_id: JSON.stringify({
            userId: args.user.id,
            planId: args.plan.id,
          }),
          subscriber: {
            email_address: args.user.email,
          },
          application_context: {
            brand_name:
              this.config.get<string>('PAYPAL_BRAND_NAME') || 'Podocarpus',
            user_action: 'SUBSCRIBE_NOW',
            return_url: this.successUrl,
            cancel_url: this.cancelUrl,
          },
        },
      },
    );

    const approvalLink = response.links?.find((link) => link.rel === 'approve');
    if (!response.id) {
      throw new ServiceUnavailableException(
        'PayPal did not return a subscription ID.',
      );
    }

    return {
      providerSessionId: response.id,
      checkoutUrl: approvalLink?.href ?? null,
    };
  }

  async cancelSubscription(providerSubscriptionId: string) {
    await this.request(
      `/v1/billing/subscriptions/${providerSubscriptionId}/cancel`,
      {
        method: 'POST',
        body: { reason: 'User requested subscription cancellation.' },
      },
    );
  }

  async verifyWebhookSignature(args: {
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
  }) {
    const webhookId = this.config.get<string>('PAYPAL_WEBHOOK_ID');
    if (!webhookId) return true;

    const verification = await this.request<{ verification_status?: string }>(
      '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        body: {
          auth_algo: this.header(args.headers, 'paypal-auth-algo'),
          cert_url: this.header(args.headers, 'paypal-cert-url'),
          transmission_id: this.header(args.headers, 'paypal-transmission-id'),
          transmission_sig: this.header(
            args.headers,
            'paypal-transmission-sig',
          ),
          transmission_time: this.header(
            args.headers,
            'paypal-transmission-time',
          ),
          webhook_id: webhookId,
          webhook_event: args.body,
        },
      },
    );

    return verification.verification_status === 'SUCCESS';
  }

  private async request<TResponse>(
    path: string,
    args: { method: 'GET' | 'POST'; body?: unknown },
  ): Promise<TResponse> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: args.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: args.body ? JSON.stringify(args.body) : undefined,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new ServiceUnavailableException(
        `PayPal request failed: ${message}`,
      );
    }

    if (response.status === 204) return undefined as TResponse;
    return (await response.json()) as TResponse;
  }

  private async getAccessToken() {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'PayPal credentials are not configured.',
      );
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new ServiceUnavailableException(`PayPal auth failed: ${message}`);
    }

    const body = (await response.json()) as PayPalAccessTokenResponse;
    if (!body.access_token) {
      throw new ServiceUnavailableException(
        'PayPal did not return an access token.',
      );
    }

    return body.access_token;
  }

  private get baseUrl() {
    return this.config.get<string>('PAYPAL_ENV') === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private get successUrl() {
    return (
      this.config.get<string>('BILLING_SUCCESS_URL') ||
      'http://localhost:3000/billing/success'
    );
  }

  private get cancelUrl() {
    return (
      this.config.get<string>('BILLING_CANCEL_URL') ||
      'http://localhost:3000/billing/cancel'
    );
  }

  private header(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ) {
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }
}
