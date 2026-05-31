# Payments Module

The payments module is for manual tenant/property rent payment tracking. It is not the app subscription billing system.

## Responsibility

This module manages operational property payments such as:

- tenant rent payment records,
- payment collection tracking,
- payment status updates,
- admin review of property-related payments.

These records are handled manually by admins and are tied to properties, leases, tenants, and rent collection workflows.

## Not Handled Here

This module does not handle:

- paid app feature subscriptions,
- Stripe Checkout,
- PayPal subscriptions,
- automatic card renewals,
- user plan entitlement state,
- provider subscription webhooks.

Those features live in `src/billing`.

## Admin Usage

Existing payment endpoints should continue to be used for tenant/property rent operations. Keep subscription and SaaS-style billing work in the billing module so rent accounting and user app subscriptions remain separate bounded contexts.
