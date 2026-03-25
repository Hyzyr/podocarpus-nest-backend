# Dashboard — Collection Tracker & Charts Plan

> **Date:** March 2026  
> **Scope:** What admin sees, what admin enters, and what charts we'll show.  
> **Depends on:** Simple payment model from `docs/PAYMENT_IMPLEMENTATION_PLAN.md`

---

## 1. What Admin Does (Data Entry)

Admin has **two things** to manage:

### A. Tenant Leases (already exists — small update)

When a tenant moves in, admin creates a lease. We just add one field:

| Field | Already exists? | What it is |
|---|---|---|
| Tenant name | Yes | Who's renting |
| Lease start / end | Yes | When |
| Monthly rent | Yes | Monthly amount |
| **Annual rent** | **NEW** | Total expected rent for the year |

> If annual rent is filled → it's an annual payment.  
> If only monthly rent is filled → it's monthly payments.  
> That's how we know if it's annual or monthly.

### B. Payments (new — simple form)

Admin clicks "Add Payment" on a property and fills:

```
┌─────────────────────────────────────────────────┐
│  ADD PAYMENT                                    │
│                                                 │
│  Property:  [Al Jawhara - Unit 1107]  (auto)    │
│  Tenant:    [IMAD ALDEEN A.]          (auto)    │
│                                                 │
│  Amount:    [________] AED                      │
│  Date:      [____-__-__]                        │
│  Type:      ( ) Annual  ( ) Monthly             │
│  Note:      [________________________] optional │
│                                                 │
│              [ Cancel ]  [ Save ]               │
└─────────────────────────────────────────────────┘
```

That's it. **4 fields** (amount, date, type, optional note).

---

## 2. Collection Tracker Table (Admin Page)

This is the main table admin sees. One row per property. Shows how much is paid vs expected.

### What it looks like:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│  COLLECTION TRACKER  2025                                                     [ ◄ 2024  2026 ► ] │
├────┬──────────────┬───────┬─────────────────┬──────────┬───────────┬───────────┬───────┬────────┤
│  # │ Building     │ Unit  │ Tenant          │ Annual   │ Collected │ Remaining │   %   │ Type   │
│    │              │       │                 │ Rent     │           │           │       │        │
├────┼──────────────┼───────┼─────────────────┼──────────┼───────────┼───────────┼───────┼────────┤
│  1 │ Pinnacle T.  │ 5105  │ (Tenant left)   │    —     │  77,500   │     —     │   —   │   —    │
│  2 │ Pinnacle T.  │ 5904  │ VACANT          │    —     │     0     │     —     │   —   │   —    │
│  3 │ Prime Res.   │  320  │ YSLAM ATAYEV    │  60,000  │  60,000   │     0     │ 100%  │ Annual │
│  4 │ Al Jawhara   │ 1107  │ IMAD ALDEEN A.  │  44,000  │  44,000   │     0     │ 100%  │ Annual │
│  5 │ Al Jawhara   │ 1307  │ ARSLAN ISMAIL   │  42,000  │  21,000   │  21,000   │  50%  │ Annual │
│  6 │ Dynasty T.   │ 307B  │ HUSSAM DIAB     │  70,000  │  35,000   │  35,000   │  50%  │ Annual │
│  7 │ Marina Ar.   │ 2010  │ ADNAN ALIZADEH  │  40,000  │   3,333   │  36,667   │   8%  │Monthly │
│  8 │ Marina Ar.   │ 1006  │ ABUBAKIR B.     │  38,000  │   9,500   │  28,500   │  25%  │Monthly │
│  . │ ...          │ ...   │ ...             │  ...     │   ...     │  ...      │  ...  │  ...   │
│ 29 │ Bloom Hts.   │ 1103  │ VACANT          │    —     │     0     │     —     │   —   │   —    │
├────┴──────────────┴───────┴─────────────────┼──────────┼───────────┼───────────┼───────┤        │
│                                  TOTALS     │8,489,334 │2,684,707  │5,804,627  │  32%  │        │
└─────────────────────────────────────────────┴──────────┴───────────┴───────────┴───────┴────────┘
```

### How it's computed:

| Column | Source |
|---|---|
| Building / Unit | `Property.buildingName`, `Property.unitNo` |
| Tenant | `TenantLease.tenantName` (active lease), or "VACANT" |
| Annual Rent | `TenantLease.annualRent` (if set), or `monthlyRent × 12` |
| Collected | Sum of all `RentPayment.amount` for this property in the selected year |
| Remaining | Annual Rent − Collected (blank if vacant) |
| % | Collected ÷ Annual Rent × 100 |
| Type | "Annual" if `annualRent` is set, "Monthly" if only `monthlyRent` |

### Clicking a row → Property Payment Detail

```
┌──────────────────────────────────────────────────────────────────┐
│  Al Jawhara · Unit 1107 · IMAD ALDEEN A.                       │
│  Annual Rent: 44,000 AED · Type: Annual                        │
│                                                     [+ Add Payment] │
├──────┬──────────────┬──────────────┬──────────┬─────────────────┤
│  #   │ Date         │ Amount       │ Type     │ Note            │
├──────┼──────────────┼──────────────┼──────────┼─────────────────┤
│  1   │ 2025-04-01   │ 11,000 AED   │ Annual   │                 │
│  2   │ 2025-08-01   │ 11,000 AED   │ Annual   │                 │
│  3   │ 2025-11-01   │ 11,000 AED   │ Annual   │                 │
│  4   │ 2026-02-01   │ 11,000 AED   │ Annual   │                 │
├──────┴──────────────┼──────────────┤          │                 │
│           TOTAL     │ 44,000 AED   │          │                 │
└─────────────────────┴──────────────┴──────────┴─────────────────┘
│  Each row has [Edit ✏️] [Delete 🗑️] buttons                     │
```

---

## 3. API Endpoints for Collection Tracker

One new endpoint (on top of the 5 payment CRUD routes from the payment plan):

| Method | Path | Auth | What it returns |
|---|---|---|---|
| `GET` | `/api/payments/collection-tracker?year=2025` | admin, superadmin | The table above — all properties with totals |

### Response shape:

```json
{
  "year": 2025,
  "summary": {
    "totalProperties": 29,
    "occupied": 24,
    "vacant": 5,
    "totalAnnualRent": 8489334,
    "totalCollected": 2684707,
    "totalRemaining": 5804627,
    "collectionRate": 32
  },
  "properties": [
    {
      "propertyId": "uuid",
      "building": "Al Jawhara",
      "unit": "1107",
      "tenant": "IMAD ALDEEN A.",
      "annualRent": 44000,
      "collected": 44000,
      "remaining": 0,
      "percent": 100,
      "type": "ANNUAL",
      "payments": [
        { "id": "uuid", "amount": 11000, "paidDate": "2025-04-01", "type": "ANNUAL", "note": null },
        { "id": "uuid", "amount": 11000, "paidDate": "2025-08-01", "type": "ANNUAL", "note": null },
        { "id": "uuid", "amount": 11000, "paidDate": "2025-11-01", "type": "ANNUAL", "note": null },
        { "id": "uuid", "amount": 11000, "paidDate": "2026-02-01", "type": "ANNUAL", "note": null }
      ]
    },
    {
      "propertyId": "uuid",
      "building": "Pinnacle Tower",
      "unit": "5904",
      "tenant": null,
      "annualRent": null,
      "collected": 0,
      "remaining": null,
      "percent": null,
      "type": null,
      "payments": []
    }
  ]
}
```

---

## 4. Charts (Future — Phase 2)

Charts are **not part of the first release**. The collection tracker table comes first.

Once we have payment data flowing in, we can add these charts. They all read from the same `RentPayment` table — no new models needed.

### 4.1 Admin Dashboard — Portfolio Charts

| Chart | What it shows | Data source |
|---|---|---|
| **Monthly Revenue** (bar chart) | How much was collected each month | `RentPayment` grouped by month |
| **Collection Rate** (donut) | % paid vs remaining across portfolio | Sum of collected vs annualRent |
| **Occupancy** (pie) | Occupied vs vacant | `Property.isVacant` counts |

```
 Monthly Revenue                         Collection Rate
 ┌──────────────────────────┐            ┌─────────────┐
 │         ████                          │   ██████    │
 │  ████   ████   ████                   │  ██ 32% ██  │
 │  ████   ████   ████   ████           │  ██ paid ██ │
 │  ████   ████   ████   ████   ████     │   ██████    │
 │  Jan    Feb    Mar    Apr    May      │  68% left   │
 └──────────────────────────┘            └─────────────┘
```

**Route:** `GET /api/payments/collection-tracker?year=2025` (same data — frontend draws the chart)

No extra backend endpoint. The frontend takes the collection tracker response and draws charts from it.

### 4.2 Per-Property — Payment Timeline

When admin clicks a property, show a simple bar chart of payments over time.

```
 Al Jawhara 1107 — Payments 2025
 ┌─────────────────────────────────┐
 │              11,000     11,000  │
 │  11,000      ████       ████   │
 │  ████        ████       ████   │
 │  ████        ████       ████   │
 │  Apr         Aug        Nov    │
 └─────────────────────────────────┘
```

**Route:** `GET /api/payments/property/:propertyId` (already exists — payment list for a property)

Frontend filters by year and draws bars. No extra endpoint needed.

### 4.3 Per-Investor — Portfolio Overview

Investor sees their properties and total collected vs expected.

```
 My Portfolio — 2025
 ┌────────────────────────────────────────┐
 │  ■ Collected  □ Remaining              │
 │                                        │
 │  Jawhara 1107  ████████████████ 100%   │
 │  Jawhara 1307  ████████░░░░░░░  50%    │
 │  Marina  2010  ██░░░░░░░░░░░░░   8%    │
 └────────────────────────────────────────┘
```

**Route:** `GET /api/payments/collection-tracker?year=2025` filtered by investor's properties on the backend.

We add one query param later: `?investorId=uuid` — optional filter for investor scope.

---

## 5. What Gets Modified / Created

### New files (4 files total)

| File | Purpose |
|---|---|
| `src/payments/payments.module.ts` | Module definition |
| `src/payments/payments.controller.ts` | 5 CRUD endpoints + collection-tracker |
| `src/payments/payments.service.ts` | CRUD + collection tracker query |
| `src/payments/dto/payment.dto.ts` | CreatePaymentDto, UpdatePaymentDto |

### Modified files (3 files)

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `PaymentType` enum, `RentPayment` model, `annualRent` on TenantLease, relation on AppUser |
| `src/app.module.ts` | Import `PaymentsModule` |
| `src/properties/dto/tenant-lease.dto.ts` | Add `annualRent` optional field |

### Nothing else changes. The rest of the app stays untouched.

---

## 6. Implementation Order

```
Step 1 ──► Schema + Migration  (30 min)
           Add enum, model, field. Run migrate.

Step 2 ──► Payment Module      (1-2 hours)
           Create 4 files. Wire up CRUD.

Step 3 ──► Collection Tracker   (1-2 hours)
           Add the query that builds the table.

Step 4 ──► Test with data       (30 min)
           Add a few payments. Verify the table.

                    ✅ DONE — MVP ready

Step 5 ──► Charts (later)
           Frontend draws charts from existing data.
           No backend changes needed.
```

---

*End of Plan*
