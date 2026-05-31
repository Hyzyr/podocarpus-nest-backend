# Subscription Billing Implementation Plan

## Scope

This plan covers paid app feature subscriptions. It is separate from tenant/property rent payments in `src/payments`.

The first implementation supports:

- monthly and yearly subscription plans,
- Stripe recurring subscriptions,
- PayPal recurring subscriptions,
- provider-hosted checkout and payment information management,
- current user subscription visibility,
- cancellation,
- invoice history,
- admin-managed plans,
- provider webhooks as the source of truth.

## Dependencies

Installed:

- `stripe`: Stripe API SDK for Checkout, Billing Portal, subscriptions, and webhook signature verification.
- `fastify-raw-body`: raw request body support for Stripe webhook signature verification with the Fastify adapter.

PayPal is implemented with REST calls through Node's global `fetch`, so no PayPal SDK dependency is required.

## Architecture

### Existing Payments Module

`src/payments` remains responsible for manual tenant/property rent payment tracking.

### New Billing Module

`src/billing` is responsible for user app subscriptions and paid features.

Main components:

- `BillingService`: business logic, subscription reads, checkout creation, cancellation, webhook processing.
- `BillingController`: public/authenticated user billing endpoints.
- `BillingAdminController`: admin plan and subscription endpoints.
- `BillingWebhooksController`: Stripe and PayPal webhook endpoints.
- `StripeBillingProvider`: Stripe Checkout, Portal, subscription cancellation, webhook verification.
- `PaypalBillingProvider`: PayPal subscription creation, cancellation, webhook verification.

## Database Model

Added Prisma enums:

- `BillingProvider`: `stripe`, `paypal`
- `BillingInterval`: `month`, `year`
- `BillingPlanStatus`: `active`, `inactive`
- `AppSubscriptionStatus`: `incomplete`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `expired`
- `BillingCheckoutStatus`: `created`, `completed`, `expired`, `canceled`
- `BillingInvoiceStatus`: `draft`, `open`, `paid`, `void`, `uncollectible`, `failed`

Added Prisma models:

- `BillingPlan`
- `AppSubscription`
- `BillingCheckoutSession`
- `BillingInvoice`
- `BillingWebhookEvent`

## Backend Endpoints

### Public/User

- `GET /api/billing/plans`
- `GET /api/billing/me/subscription`
- `GET /api/billing/me/invoices`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/billing/cancel`

### Admin

- `GET /api/admin/billing/plans`
- `POST /api/admin/billing/plans`
- `PATCH /api/admin/billing/plans/:id`
- `GET /api/admin/billing/subscriptions`

### Webhooks

- `POST /api/billing/webhooks/stripe`
- `POST /api/billing/webhooks/paypal`

## Security Rules

- Users must authenticate to create checkout, view subscription, view invoices, open portal, or cancel subscription.
- Admin billing endpoints are restricted to `admin` and `superadmin` roles.
- Stripe webhook signatures are verified with `STRIPE_WEBHOOK_SECRET` using the raw request body.
- PayPal webhook signatures are verified when `PAYPAL_WEBHOOK_ID` is configured.
- The backend does not store card numbers or payment method details.
- Provider webhook events are stored idempotently before processing.

## Provider Setup Steps

### Stripe

1. Create products and recurring prices in Stripe Dashboard.
2. Copy the recurring Price IDs into `BillingPlan.stripePriceId`.
3. Configure webhook endpoint: `/api/billing/webhooks/stripe`.
4. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.updated`
5. Configure Stripe Billing Portal in Stripe Dashboard.

### PayPal

1. Create recurring products/plans in PayPal.
2. Copy PayPal plan IDs into `BillingPlan.paypalPlanId`.
3. Configure webhook endpoint: `/api/billing/webhooks/paypal`.
4. Subscribe to these events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=...
PAYPAL_BRAND_NAME=Podocarpus

BILLING_SUCCESS_URL=http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}
BILLING_CANCEL_URL=http://localhost:3000/billing/cancel
BILLING_PORTAL_RETURN_URL=http://localhost:3000/account/billing
```

## Implementation Status

Completed in phase 1:

- schema and migration,
- Stripe dependency and provider,
- Fastify raw body wiring,
- PayPal REST provider,
- billing service,
- user/admin/webhook controllers,
- Swagger DTOs/decorators,
- billing README,
- payments README,
- frontend handoff document.

Recommended next phase:

- add entitlement middleware/helpers for paid feature checks,
- add automated webhook unit tests with mocked providers,
- add plan upgrade/downgrade flows,
- add admin subscription filters/pagination,
- add seed data for local billing plans if desired.
