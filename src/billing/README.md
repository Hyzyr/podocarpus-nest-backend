# Billing Module

The billing module handles paid app features and user subscriptions. It is separate from the `payments` module, which tracks manual tenant/property rent payments.

## What This Module Supports

- Monthly and yearly recurring subscription plans.
- Stripe Checkout subscriptions with automatic renewal.
- PayPal subscription approval flows with automatic renewal through PayPal plans.
- Current user subscription status, start date, end date, cancellation state, and plan details.
- User invoice history for provider billing invoices.
- Stripe Billing Portal sessions so users can update payment method/payment information without this backend storing card details.
- Admin-managed billing plans.
- Stripe and PayPal webhooks with idempotent event storage.

## Main Tables

- `BillingPlan`: editable app subscription plans. Price is stored in minor currency units, for example `9900` for `$99.00`.
- `AppSubscription`: user subscription state synced from Stripe/PayPal webhooks.
- `BillingCheckoutSession`: checkout/approval flow tracking.
- `BillingInvoice`: invoice/payment records from providers.
- `BillingWebhookEvent`: provider event idempotency and audit trail.

## Public/User Endpoints

All paths use the global `/api` prefix.

- `GET /api/billing/plans`: public list of active subscription plans.
- `GET /api/billing/me/subscription`: authenticated current subscription and plan details.
- `GET /api/billing/me/invoices`: authenticated user invoice history.
- `POST /api/billing/checkout`: authenticated checkout creation. Body: `{ "provider": "stripe" | "paypal", "planId": "..." }`.
- `POST /api/billing/portal`: authenticated Stripe payment information portal creation.
- `POST /api/billing/cancel`: authenticated subscription cancellation.

## Admin Endpoints

Admin and superadmin only.

- `GET /api/admin/billing/plans`: list all plans, including provider IDs.
- `POST /api/admin/billing/plans`: create a plan.
- `PATCH /api/admin/billing/plans/:id`: update plan details, status, features, display order, and provider price/plan IDs.
- `GET /api/admin/billing/subscriptions`: list recent user app subscriptions.

## Webhook Endpoints

- `POST /api/billing/webhooks/stripe`
- `POST /api/billing/webhooks/paypal`

Stripe webhooks require raw request body support and `STRIPE_WEBHOOK_SECRET`. PayPal signature verification is enabled when `PAYPAL_WEBHOOK_ID` is configured.

Recommended Stripe events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.updated`

Recommended PayPal events:

- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.EXPIRED`

## Required Environment Variables

Stripe:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

PayPal:

```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=...
PAYPAL_BRAND_NAME=Podocarpus
```

Frontend redirects:

```env
BILLING_SUCCESS_URL=http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}
BILLING_CANCEL_URL=http://localhost:3000/billing/cancel
BILLING_PORTAL_RETURN_URL=http://localhost:3000/account/billing
```

## Frontend Flow

1. Load active plans from `GET /api/billing/plans`.
2. User chooses a plan and provider.
3. Call `POST /api/billing/checkout`.
4. Redirect user to the returned `checkoutUrl`.
5. After provider payment/approval, show a pending/success page but rely on `GET /api/billing/me/subscription` for the real subscription state.
6. Use `POST /api/billing/portal` for Stripe payment method changes.
7. Use `POST /api/billing/cancel` for cancellation.

Do not send or store card details in this backend. Stripe/PayPal hosted checkout and portals handle payment information securely.
