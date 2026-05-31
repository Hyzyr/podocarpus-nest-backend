import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppSubscriptionStatus,
  BillingCheckoutStatus,
  BillingInvoiceStatus,
  BillingPlan,
  BillingPlanStatus,
  BillingProvider,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CancelSubscriptionDto,
  CreateBillingCheckoutDto,
  CreateBillingPlanDto,
  CreateBillingPortalDto,
  UpdateBillingPlanDto,
} from './dto/billing.dto';
import { PaypalBillingProvider } from './providers/paypal-billing.provider';
import { StripeBillingProvider } from './providers/stripe-billing.provider';

type StripeExpandableId = string | { id: string } | null;
type StripeEvent = { id: string; type: string; data: { object: unknown } };
type StripeCheckoutSession = {
  id: string;
  subscription?: StripeExpandableId;
};
type StripeSubscription = {
  id: string;
  metadata?: Record<string, string>;
  status: string;
  customer?: StripeExpandableId;
  current_period_start?: number | null;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean;
  canceled_at?: number | null;
};
type StripeInvoice = {
  id: string;
  subscription?: StripeExpandableId;
  customer?: StripeExpandableId;
  status?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  currency?: string | null;
  hosted_invoice_url?: string | null;
  status_transitions?: { paid_at?: number | null };
};

const ACTIVE_SUBSCRIPTION_STATUSES: AppSubscriptionStatus[] = [
  AppSubscriptionStatus.active,
  AppSubscriptionStatus.trialing,
  AppSubscriptionStatus.past_due,
  AppSubscriptionStatus.incomplete,
];

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeBillingProvider,
    private readonly paypalProvider: PaypalBillingProvider,
  ) {}

  async getPublicPlans() {
    const plans = await this.prisma.billingPlan.findMany({
      where: { status: BillingPlanStatus.active },
      orderBy: [{ displayOrder: 'asc' }, { priceAmount: 'asc' }],
    });

    return plans.map((plan) => this.mapPlan(plan, false));
  }

  async getAdminPlans() {
    const plans = await this.prisma.billingPlan.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return plans.map((plan) => this.mapPlan(plan, true));
  }

  async createPlan(dto: CreateBillingPlanDto) {
    const plan = await this.prisma.billingPlan.create({
      data: {
        ...dto,
        currency: dto.currency?.toLowerCase() ?? 'usd',
        features: dto.features ?? [],
      },
    });

    return this.mapPlan(plan, true);
  }

  async updatePlan(id: string, dto: UpdateBillingPlanDto) {
    await this.assertPlanExists(id);
    const { features, currency, ...rest } = dto;

    const plan = await this.prisma.billingPlan.update({
      where: { id },
      data: {
        ...rest,
        ...(currency !== undefined && { currency: currency.toLowerCase() }),
        ...(features !== undefined && { features }),
      },
    });

    return this.mapPlan(plan, true);
  }

  async getCurrentSubscription(userId: string) {
    const subscription = await this.prisma.appSubscription.findFirst({
      where: {
        userId,
        status: { in: ACTIVE_SUBSCRIPTION_STATUSES },
      },
      include: { plan: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!subscription) return null;
    return {
      ...subscription,
      plan: this.mapPlan(subscription.plan, false),
    };
  }

  async getUserInvoices(userId: string) {
    return this.prisma.billingInvoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });
  }

  async getAdminSubscriptions() {
    return this.prisma.appSubscription.findMany({
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isEnabled: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
  }

  async createCheckout(userId: string, dto: CreateBillingCheckoutDto) {
    const [user, plan] = await Promise.all([
      this.prisma.appUser.findUnique({
        where: { id: userId },
        select: { id: true, email: true, isEnabled: true },
      }),
      this.prisma.billingPlan.findUnique({ where: { id: dto.planId } }),
    ]);

    if (!user || !user.isEnabled)
      throw new ForbiddenException('User is disabled.');
    if (!plan || plan.status !== BillingPlanStatus.active) {
      throw new NotFoundException('Active billing plan not found.');
    }

    const providerSession =
      dto.provider === BillingProvider.stripe
        ? await this.stripeProvider.createCheckoutSession({ plan, user })
        : await this.paypalProvider.createCheckoutSession({ plan, user });

    const checkout = await this.prisma.billingCheckoutSession.create({
      data: {
        userId,
        planId: plan.id,
        provider: dto.provider,
        providerSessionId: providerSession.providerSessionId,
        checkoutUrl: providerSession.checkoutUrl,
        metadata: {
          providerCustomerId: providerSession.providerCustomerId ?? null,
        },
      },
    });

    return checkout;
  }

  async createPortal(userId: string, dto: CreateBillingPortalDto) {
    const subscription = await this.findOwnedSubscription(userId, undefined);
    if (subscription.provider !== BillingProvider.stripe) {
      throw new BadRequestException(
        'Payment method portal is currently available for Stripe subscriptions only.',
      );
    }
    if (!subscription.providerCustomerId) {
      throw new BadRequestException(
        'Subscription does not have a Stripe customer ID.',
      );
    }

    return this.stripeProvider.createPortalSession(
      subscription.providerCustomerId,
      dto.returnUrl,
    );
  }

  async cancelSubscription(userId: string, dto: CancelSubscriptionDto) {
    const subscription = await this.findOwnedSubscription(
      userId,
      dto.subscriptionId,
    );
    if (!subscription.providerSubscriptionId) {
      throw new BadRequestException(
        'Subscription does not have a provider ID yet.',
      );
    }

    if (subscription.provider === BillingProvider.stripe) {
      await this.stripeProvider.cancelAtPeriodEnd(
        subscription.providerSubscriptionId,
      );
      return this.prisma.appSubscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true },
        include: { plan: true },
      });
    }

    await this.paypalProvider.cancelSubscription(
      subscription.providerSubscriptionId,
    );
    return this.prisma.appSubscription.update({
      where: { id: subscription.id },
      data: {
        status: AppSubscriptionStatus.canceled,
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    });
  }

  async handleStripeWebhook(rawBody: string | Buffer, signature: string) {
    const event = this.stripeProvider.constructWebhookEvent(rawBody, signature);
    const created = await this.createWebhookEvent({
      provider: BillingProvider.stripe,
      providerEventId: event.id,
      eventType: event.type,
      payload: event as unknown as Prisma.InputJsonValue,
    });

    if (!created) return { received: true, duplicate: true };

    await this.processStripeEvent(event);
    await this.markWebhookProcessed(BillingProvider.stripe, event.id);
    return { received: true };
  }

  async handlePaypalWebhook(args: {
    headers: Record<string, string | string[] | undefined>;
    body: Record<string, unknown>;
  }) {
    const verified = await this.paypalProvider.verifyWebhookSignature(args);
    if (!verified)
      throw new ForbiddenException('Invalid PayPal webhook signature.');

    const eventId = this.toString(args.body.id) || randomUUID();
    const eventType = this.toString(args.body.event_type) || 'unknown';
    const created = await this.createWebhookEvent({
      provider: BillingProvider.paypal,
      providerEventId: eventId,
      eventType,
      payload: args.body as Prisma.InputJsonObject,
    });

    if (!created) return { received: true, duplicate: true };

    await this.processPaypalEvent(args.body, eventType);
    await this.markWebhookProcessed(BillingProvider.paypal, eventId);
    return { received: true };
  }

  private async processStripeEvent(event: StripeEvent) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleStripeCheckoutCompleted(
          event.data.object as StripeCheckoutSession,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.upsertStripeSubscription(
          event.data.object as StripeSubscription,
        );
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'invoice.updated':
        await this.upsertStripeInvoice(event.data.object as StripeInvoice);
        break;
    }
  }

  private async handleStripeCheckoutCompleted(session: StripeCheckoutSession) {
    await this.prisma.billingCheckoutSession.updateMany({
      where: {
        provider: BillingProvider.stripe,
        providerSessionId: session.id,
      },
      data: { status: BillingCheckoutStatus.completed },
    });

    const subscriptionId = this.toStripeId(session.subscription);
    if (!subscriptionId) return;

    const subscription =
      await this.stripeProvider.retrieveSubscription(subscriptionId);
    await this.upsertStripeSubscription(subscription);
  }

  private async upsertStripeSubscription(subscription: StripeSubscription) {
    const existing = await this.prisma.appSubscription.findUnique({
      where: { providerSubscriptionId: subscription.id },
    });
    const userId =
      this.toString(subscription.metadata?.userId) || existing?.userId;
    const planId =
      this.toString(subscription.metadata?.planId) || existing?.planId;
    if (!userId || !planId) return;

    const data = {
      userId,
      planId,
      provider: BillingProvider.stripe,
      status: this.mapStripeSubscriptionStatus(subscription.status),
      providerCustomerId: this.toStripeId(subscription.customer),
      providerSubscriptionId: subscription.id,
      currentPeriodStart: this.fromUnix(subscription.current_period_start),
      currentPeriodEnd: this.fromUnix(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      canceledAt: this.fromUnix(subscription.canceled_at),
      metadata: this.toInputJsonObject(subscription.metadata ?? {}),
    };

    await this.prisma.appSubscription.upsert({
      where: { providerSubscriptionId: subscription.id },
      create: data,
      update: data,
    });
  }

  private async upsertStripeInvoice(invoice: StripeInvoice) {
    const subscriptionId = this.toStripeId(invoice.subscription);
    const subscription = subscriptionId
      ? await this.prisma.appSubscription.findUnique({
          where: { providerSubscriptionId: subscriptionId },
        })
      : null;

    const customerId = this.toStripeId(invoice.customer);
    const userId = subscription?.userId;
    if (!userId) return;

    await this.prisma.billingInvoice.upsert({
      where: { providerInvoiceId: invoice.id },
      create: {
        userId,
        planId: subscription?.planId,
        subscriptionId: subscription?.id,
        provider: BillingProvider.stripe,
        providerInvoiceId: invoice.id,
        providerSubscriptionId: subscriptionId,
        status: this.mapStripeInvoiceStatus(invoice.status),
        amountDue: invoice.amount_due ?? 0,
        amountPaid: invoice.amount_paid ?? 0,
        currency: invoice.currency || 'usd',
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        paidAt: this.fromUnix(invoice.status_transitions?.paid_at),
        metadata: this.toInputJsonObject({ customerId }),
      },
      update: {
        status: this.mapStripeInvoiceStatus(invoice.status),
        amountDue: invoice.amount_due ?? 0,
        amountPaid: invoice.amount_paid ?? 0,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        paidAt: this.fromUnix(invoice.status_transitions?.paid_at),
      },
    });
  }

  private async processPaypalEvent(
    event: Record<string, unknown>,
    eventType: string,
  ) {
    const resource = this.toRecord(event.resource);
    if (!resource) return;

    const providerSubscriptionId = this.toString(resource.id);
    if (!providerSubscriptionId) return;

    if (eventType.startsWith('BILLING.SUBSCRIPTION.')) {
      await this.upsertPaypalSubscription(
        resource,
        eventType,
        providerSubscriptionId,
      );
    }
  }

  private async upsertPaypalSubscription(
    resource: Record<string, unknown>,
    eventType: string,
    providerSubscriptionId: string,
  ) {
    const existing = await this.prisma.appSubscription.findUnique({
      where: { providerSubscriptionId },
    });
    const custom = this.parsePaypalCustomId(this.toString(resource.custom_id));
    const checkout = await this.prisma.billingCheckoutSession.findUnique({
      where: { providerSessionId: providerSubscriptionId },
    });
    const userId = custom.userId || existing?.userId || checkout?.userId;
    const planId = custom.planId || existing?.planId || checkout?.planId;
    if (!userId || !planId) return;

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      await this.prisma.billingCheckoutSession.updateMany({
        where: {
          provider: BillingProvider.paypal,
          providerSessionId: providerSubscriptionId,
        },
        data: { status: BillingCheckoutStatus.completed },
      });
    }

    const status = this.mapPaypalSubscriptionStatus(
      this.toString(resource.status),
      eventType,
    );

    await this.prisma.appSubscription.upsert({
      where: { providerSubscriptionId },
      create: {
        userId,
        planId,
        provider: BillingProvider.paypal,
        providerSubscriptionId,
        status,
        currentPeriodStart: this.toDate(resource.start_time),
        currentPeriodEnd: this.getPaypalNextBillingTime(resource),
        canceledAt:
          status === AppSubscriptionStatus.canceled ? new Date() : null,
        metadata: this.toInputJsonObject(resource),
      },
      update: {
        status,
        canceledAt:
          status === AppSubscriptionStatus.canceled ? new Date() : undefined,
        metadata: this.toInputJsonObject(resource),
      },
    });
  }

  private async findOwnedSubscription(userId: string, subscriptionId?: string) {
    const subscription = subscriptionId
      ? await this.prisma.appSubscription.findUnique({
          where: { id: subscriptionId },
          include: { plan: true },
        })
      : await this.prisma.appSubscription.findFirst({
          where: {
            userId,
            status: { in: ACTIVE_SUBSCRIPTION_STATUSES },
          },
          include: { plan: true },
          orderBy: { updatedAt: 'desc' },
        });

    if (!subscription) throw new NotFoundException('Subscription not found.');
    if (subscription.userId !== userId)
      throw new ForbiddenException('Not your subscription.');
    return subscription;
  }

  private async assertPlanExists(id: string) {
    const plan = await this.prisma.billingPlan.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!plan) throw new NotFoundException('Billing plan not found.');
  }

  private async createWebhookEvent(args: {
    provider: BillingProvider;
    providerEventId: string;
    eventType: string;
    payload: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.billingWebhookEvent.create({
        data: args,
      });
      return true;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) return false;
      throw error;
    }
  }

  private markWebhookProcessed(
    provider: BillingProvider,
    providerEventId: string,
  ) {
    return this.prisma.billingWebhookEvent.update({
      where: {
        provider_providerEventId: { provider, providerEventId },
      },
      data: { processedAt: new Date() },
    });
  }

  private mapPlan(plan: BillingPlan, includeProviderIds: boolean) {
    return {
      ...plan,
      features: this.toStringArray(plan.features),
      stripePriceId: includeProviderIds ? plan.stripePriceId : undefined,
      paypalPlanId: includeProviderIds ? plan.paypalPlanId : undefined,
    };
  }

  private mapStripeSubscriptionStatus(status: string) {
    if (status === 'active') return AppSubscriptionStatus.active;
    if (status === 'trialing') return AppSubscriptionStatus.trialing;
    if (status === 'past_due') return AppSubscriptionStatus.past_due;
    if (status === 'canceled') return AppSubscriptionStatus.canceled;
    if (status === 'unpaid') return AppSubscriptionStatus.unpaid;
    return AppSubscriptionStatus.incomplete;
  }

  private mapStripeInvoiceStatus(status: string | null | undefined) {
    if (status === 'paid') return BillingInvoiceStatus.paid;
    if (status === 'void') return BillingInvoiceStatus.void;
    if (status === 'uncollectible') return BillingInvoiceStatus.uncollectible;
    if (status === 'draft') return BillingInvoiceStatus.draft;
    if (status === 'open') return BillingInvoiceStatus.open;
    return BillingInvoiceStatus.failed;
  }

  private mapPaypalSubscriptionStatus(
    status: string | null,
    eventType: string,
  ) {
    if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      return AppSubscriptionStatus.canceled;
    }
    if (status === 'ACTIVE') return AppSubscriptionStatus.active;
    if (status === 'SUSPENDED') return AppSubscriptionStatus.past_due;
    if (status === 'CANCELLED') return AppSubscriptionStatus.canceled;
    if (status === 'EXPIRED') return AppSubscriptionStatus.expired;
    return AppSubscriptionStatus.incomplete;
  }

  private parsePaypalCustomId(value: string | null) {
    if (!value) return { userId: null, planId: null };
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return {
        userId: this.toString(parsed.userId),
        planId: this.toString(parsed.planId),
      };
    } catch {
      return { userId: null, planId: null };
    }
  }

  private toStringArray(value: Prisma.JsonValue) {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private toStripeId(value: string | { id: string } | null | undefined) {
    if (!value) return null;
    return typeof value === 'string' ? value : value.id;
  }

  private fromUnix(value?: number | null) {
    return value ? new Date(value * 1000) : null;
  }

  private toString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return null;
    return value as Record<string, unknown>;
  }

  private toDate(value: unknown) {
    if (typeof value !== 'string') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getPaypalNextBillingTime(resource: Record<string, unknown>) {
    const billingInfo = this.toRecord(resource.billing_info);
    return this.toDate(billingInfo?.next_billing_time);
  }

  private toInputJsonObject(
    value: Record<string, unknown>,
  ): Prisma.InputJsonObject {
    const data: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, item] of Object.entries(value)) {
      const jsonValue = this.toInputJsonValue(item);
      if (jsonValue !== undefined) data[key] = jsonValue;
    }
    return data as Prisma.InputJsonObject;
  }

  private toInputJsonValue(
    value: unknown,
  ): Prisma.InputJsonValue | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (Array.isArray(value)) {
      return value
        .map((item) => this.toInputJsonValue(item))
        .filter(
          (item): item is Prisma.InputJsonValue | null => item !== undefined,
        );
    }
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object')
      return this.toInputJsonObject(value as Record<string, unknown>);
    return undefined;
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
