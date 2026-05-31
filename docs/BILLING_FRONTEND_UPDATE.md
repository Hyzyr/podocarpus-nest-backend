# Billing Frontend Update

This backend now has a separate subscription billing system for paid app features. It is not the same as tenant/property rent payments.

## Backend Scope

Use `billing` for app subscriptions:

- Stripe recurring subscriptions through hosted Checkout.
- PayPal recurring subscriptions through PayPal approval flow.
- Monthly and yearly plan intervals.
- User subscription state with provider, status, current period start/end, and cancellation state.
- User invoice history.
- Stripe-hosted billing portal for payment method/payment information updates.

Keep using `payments` only for manual tenant/property rent payment workflows.

## User Flow

1. Fetch active plans:

```http
GET /api/billing/plans
```

2. User picks a plan and provider.

3. Create checkout:

```http
POST /api/billing/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "stripe",
  "planId": "billing-plan-id"
}
```

`provider` can be `stripe` or `paypal`.

4. Redirect the browser to `checkoutUrl` from the response.

5. After redirect back to the frontend success page, do not assume the subscription is active from the redirect alone. Call:

```http
GET /api/billing/me/subscription
Authorization: Bearer <token>
```

Provider webhooks are the source of truth.

## Subscription Status UI

Use `GET /api/billing/me/subscription` to show:

- current plan name/features,
- `provider`,
- `status`,
- `currentPeriodStart`,
- `currentPeriodEnd`,
- `cancelAtPeriodEnd`.

Important statuses:

- `active`: user has access.
- `trialing`: user has access during trial.
- `past_due`: payment issue; show warning and billing action.
- `incomplete`: checkout/subscription was started but provider has not confirmed active payment.
- `canceled`, `unpaid`, `expired`: no paid access unless product rules say otherwise.

## Payment Information

For Stripe subscriptions, create a hosted billing portal session:

```http
POST /api/billing/portal
Authorization: Bearer <token>
Content-Type: application/json

{
  "returnUrl": "https://pdcps.co/account/billing"
}
```

Redirect the browser to the returned `url`. Users can update payment method/payment info in Stripe. The backend never stores card details.

PayPal payment method changes are managed from the user's PayPal account/approval flow; the current backend portal endpoint is Stripe-only.

## Cancel Subscription

```http
POST /api/billing/cancel
Authorization: Bearer <token>
Content-Type: application/json

{}
```

Optional body if the UI stores a specific subscription ID:

```json
{
  "subscriptionId": "subscription-id"
}
```

Stripe cancellation is scheduled at period end. PayPal cancellation is immediate.

## Invoices

```http
GET /api/billing/me/invoices
Authorization: Bearer <token>
```

Show amount fields as minor units from backend, for example `4900` means `$49.00` when currency is USD.

## Admin Plan Management

Admin panel endpoints:

- `GET /api/admin/billing/plans`
- `POST /api/admin/billing/plans`
- `PATCH /api/admin/billing/plans/:id`
- `GET /api/admin/billing/subscriptions`

When creating/editing a plan, store provider IDs from Stripe/PayPal dashboards:

- `stripePriceId`: Stripe recurring Price ID, for example `price_...`.
- `paypalPlanId`: PayPal recurring billing plan ID, for example `P-...`.

A plan can support Stripe, PayPal, or both depending on which provider IDs are configured.

## Swagger

Swagger is updated through the new controllers and DTOs. Open:

```http
/swagger
```

Tags to use:

- `billing`
- `admin-billing`
- `billing-webhooks`
