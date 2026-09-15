# Rent Collection — Backend Update for Frontend

Date: 2026-09-15
Swagger: `GET /swagger` (JSON at `/swagger-json`). Every route below includes the
global `/api` prefix.

---

## TL;DR

Tenants can now have **scheduled rent collection dates**, so the admin UI can show
what's been collected, what's coming, and what's late.

| You need | Call |
|---|---|
| Set collection dates when creating a tenant | `POST /api/tenant-leases` with `paymentSchedule` |
| Set or change them later | `PUT /api/tenant-leases/:id/schedule` |
| Show a lease's schedule | `GET /api/tenant-leases/:id/schedule` |
| Build the collection dashboard | `GET /api/payments/dashboard` |
| Table of everything due / late | `GET /api/payments/installments` |
| Mark a payment received | `POST /api/payments/installments/:id/collect` |
| Edit / waive a scheduled date | `PATCH /api/payments/installments/:id` |
| Record an off-schedule payment | `POST /api/payments` |

**Nothing existing broke.** Every change is additive — see
[Compatibility](#7-compatibility--what-to-watch-for) for the two things worth
checking.

---

## 1. The model, in four sentences

- A **TenantLease** is a tenant renting a property. It now carries a
  `paymentFrequency`.
- A **RentInstallment** is *one scheduled collection date* — expected amount, due
  date, status. The set of them is the lease's **schedule**.
- A **RentPayment** is *money actually received*. It usually points at an
  installment (`installmentId`); when it doesn't, it's an ad-hoc collection that
  still counts toward the lease total.
- Collecting money never overwrites the schedule — the installment's `amountPaid`
  and `status` are **re-derived** from its payments on every write.

```
TenantLease ──< RentInstallment ──< RentPayment
   (tenant)      (what's owed,        (what arrived)
                  when)                      │
                                             └── installmentId: null = ad-hoc
```

### Frequencies

| `RentFrequency` | Collections per year |
|---|---|
| `ANNUAL` | 1 |
| `SEMI_ANNUAL` | 2 |
| `QUARTERLY` | 4 |
| `BI_MONTHLY` | 6 (every 2 months) |
| `MONTHLY` | 12 |
| `CUSTOM` | you supply the dates |

### Statuses

| `InstallmentStatus` | Means |
|---|---|
| `PENDING` | nothing collected yet |
| `PARTIAL` | some money in, balance outstanding |
| `PAID` | settled |
| `WAIVED` | admin forgave it — excluded from totals |
| `CANCELLED` | no longer applies — excluded from totals |

**There is no `OVERDUE` status.** Overdue is *derived* on every read and comes
back as `isOverdue: boolean` + `daysOverdue: number` on the installment. Don't
compute it yourself and don't cache it across a day boundary — read the flag.

Likewise `PAID` and `PARTIAL` are derived from payments. You cannot set them;
`PATCH` will 400 if you try. You *can* set `PENDING`, `WAIVED`, `CANCELLED`.

---

## 2. Types

```ts
type RentFrequency =
  | 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'BI_MONTHLY' | 'MONTHLY' | 'CUSTOM';

type InstallmentStatus =
  | 'PENDING' | 'PARTIAL' | 'PAID' | 'WAIVED' | 'CANCELLED';

// Period a payment covers. NOTE: this enum GREW — see §7.
type PaymentType =
  | 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'BI_MONTHLY' | 'MONTHLY' | 'CUSTOM';

/** Lease + property identity, so a row renders without a second fetch. */
type InstallmentContext = {
  leaseId: string;
  propertyId: string;
  tenantName: string | null;
  buildingName: string | null;
  unitNo: string | null;
  propertyTitle: string | null;
};

type RentPayment = {
  id: string;
  tenantLeaseId: string;
  installmentId: string | null;   // null = ad-hoc / off-schedule
  amount: number;                 // AED, 2dp
  paidDate: string;               // ISO
  type: PaymentType;
  method: string | null;          // "Bank Transfer", "Cheque"…
  reference: string | null;       // cheque no. / txn ref
  note: string | null;
  recordedById: string | null;    // admin who entered it
  context?: InstallmentContext;   // present on cross-lease lists only
  createdAt: string;
  updatedAt: string;
};

type RentInstallment = {
  id: string;
  tenantLeaseId: string;
  sequence: number;               // 1-based position in the schedule
  dueDate: string;                // ISO
  amountDue: number;
  amountPaid: number;             // sum of its payments

  // ---- derived server-side on every read, never stored ----
  balance: number;                // amountDue - amountPaid, floored at 0; 0 once WAIVED
  isOverdue: boolean;             // unsettled AND past due, evaluated now
  daysOverdue: number;            // 0 when not overdue
  // ---------------------------------------------------------

  status: InstallmentStatus;
  periodStart: string | null;     // rental period this covers
  periodEnd: string | null;
  paidInFullAt: string | null;
  note: string | null;

  payments?: RentPayment[];       // included on detail + schedule reads
  context?: InstallmentContext;   // included on cross-lease lists
  createdAt: string;
  updatedAt: string;
};
```

---

## 3. Creating a tenant with collection dates

`paymentSchedule` is **optional**. Leave it out and the tenant is created with no
schedule; assign one later with `PUT /api/tenant-leases/:id/schedule` (identical
body). The UI can legitimately offer "set this up later".

```http
POST /api/tenant-leases
```
```jsonc
{
  "propertyId": "…",
  "tenantName": "Ahmed Khan",
  "tenantEmail": "ahmed@example.com",
  "leaseStart": "2026-01-01T00:00:00.000Z",
  "leaseEnd": "2026-12-31T00:00:00.000Z",
  "monthlyRent": 10000,
  "annualRent": 120000,

  "paymentSchedule": {
    "frequency": "QUARTERLY",
    "anchorDay": 1          // optional: force every due date to the 1st (1-28)
  }
}
```

That produces four installments of 30,000 on 1 Jan / 1 Apr / 1 Jul / 1 Oct.

### What the generator does

- **Amount** — defaults to the lease `annualRent`, else `monthlyRent × 12`.
  Override with `annualAmount`. Split evenly across each 12-month cycle; the
  **last installment of a cycle absorbs the rounding remainder**, so a cycle always
  sums exactly to the annual amount. Don't re-derive amounts client-side.
- **Count** — covers the lease term. A 2-year lease at `MONTHLY` gives 24
  installments totalling 2× the annual amount. No `leaseEnd` → one year. Override
  with `count` (max 120).
- **First date** — the lease start, unless you pass `firstDueDate`.
- **`anchorDay`** is capped at 28 so every month can hold it.

### Custom dates

```jsonc
{
  "frequency": "CUSTOM",
  "installments": [
    { "dueDate": "2026-03-15T00:00:00.000Z", "amountDue": 50000, "note": "first half" },
    { "dueDate": "2026-09-15T00:00:00.000Z", "amountDue": 70000, "note": "second half" }
  ]
}
```

With `CUSTOM`, `annualAmount` / `count` / `firstDueDate` are ignored and
`installments` is required. Dates are sorted for you; `sequence` is assigned.

### Replacing a schedule that already has money against it

`PUT /api/tenant-leases/:id/schedule` returns **409 `CONFLICT`** if any
installment has been paid against. Show the user a confirm, then retry with
`"force": true`. The payments are kept — they just become ad-hoc (their
`installmentId` goes null) and still count toward lease totals.

```ts
try {
  await api.put(`/tenant-leases/${id}/schedule`, body);
} catch (e) {
  if (e.response?.data?.code === 'CONFLICT') {
    if (await confirmDialog('This schedule already has payments. Replace it?')) {
      await api.put(`/tenant-leases/${id}/schedule`, { ...body, force: true });
    }
  }
}
```

### Reading it back

```http
GET /api/tenant-leases/:id/schedule
```
```ts
type LeaseSchedule = {
  leaseId: string;
  propertyId: string;
  tenantName: string | null;
  paymentFrequency: RentFrequency;
  paymentAnchorDay: number | null;
  scheduleUpdatedAt: string | null;
  summary: {
    installmentCount: number;
    totalScheduled: number;    // excludes WAIVED / CANCELLED
    totalCollected: number;
    totalOutstanding: number;
    overdueCount: number;
    overdueAmount: number;
    collectionRate: number;    // 0-100, integer
    nextDue: RentInstallment | null;
  };
  installments: RentInstallment[];   // each with its payments[]
};
```

`GET` is open to any authenticated user; `PUT` and the add-installment `POST` are
**admin / superadmin only**.

---

## 4. The dashboard

```http
GET /api/payments/dashboard?year=2026&upcomingDays=60&listSize=10
```

Query params, all optional: `year` (default: current) · `from`/`to` (ISO; override
`year`) · `propertyId` (scope to one property) · `upcomingDays` (default 60) ·
`listSize` (rows per embedded list, default 10, max 50).

```ts
type PaymentsDashboard = {
  generatedAt: string;
  range: { from: string; to: string };

  totals: {
    scheduled: number;           // due in the window (excl. WAIVED/CANCELLED)
    collected: number;           // collectedScheduled + collectedAdHoc
    collectedScheduled: number;  // received against those installments
    collectedAdHoc: number;      // received in the window, no installment attached
    outstanding: number;         // scheduled - collectedScheduled, floored at 0
    overdueAmount: number;
    overdueCount: number;
    upcomingAmount: number;
    upcomingCount: number;
    collectionRate: number;      // collectedScheduled / scheduled, 0-100
  };

  byStatus: {
    PENDING: number; PARTIAL: number; PAID: number;
    WAIVED: number; CANCELLED: number;
  };

  monthly: { month: string; scheduled: number; collected: number }[]; // "2026-03"

  upcoming: RentInstallment[];      // soonest first, within upcomingDays
  overdue: RentInstallment[];       // oldest first
  recentPayments: RentPayment[];    // newest first
};
```

Two things to get right when you render this:

1. **`upcoming` and `overdue` are relative to *now*, not to the window.** They
   answer "what needs chasing today". Changing `year` will not change them.
   Don't label them "upcoming in 2026".
2. **`collectionRate` uses `collectedScheduled`, not `collected`.** Ad-hoc money
   has no target to be measured against, so including it could show >100%. If you
   display "collected" as a single headline number, use `totals.collected`; if you
   display it *against* a target, pair `collectedScheduled` with `scheduled`.

`monthly` is pre-seeded with every month in the window, so months with no activity
come back as zeros rather than gaps — safe to feed straight into a chart.

### The drill-down table

```http
GET /api/payments/installments?overdueOnly=true&limit=50&offset=0
```

Filters: `leaseId` · `propertyId` · `status` · `from` / `to` (due date) ·
`overdueOnly` · `limit` (max 100) · `offset`.

This is a **new** endpoint, so it uses the paginated envelope (per
`docs/API_CONVENTIONS.md`), not bare-array-plus-headers:

```ts
type Paginated<T> = {
  items: T[]; total: number; limit: number; offset: number; hasMore: boolean;
};
// → Paginated<RentInstallment>, each item carrying `context` for the row label
```

---

## 5. Taking a payment

### The common case — tenant paid what they owed

```http
POST /api/payments/installments/:id/collect
Content-Type: application/json

{}
```

An **empty body settles the outstanding balance in full.** Amount, date and
payment type all default sensibly (`paidDate` = now, `type` = the lease
frequency). This is the one-click "Mark as paid" button.

### With details, or partial

```jsonc
{
  "amount": 10000,                            // omit = full balance
  "paidDate": "2026-04-03T00:00:00.000Z",     // omit = now
  "method": "Cheque",
  "reference": "CHQ-004821",
  "note": "tenant paid early"
}
```

A partial amount leaves the installment `PARTIAL` with a non-zero `balance`.

**Response** (201):

```ts
type CollectResult = { payment: RentPayment; installment: RentInstallment };
```

The returned `installment` is already re-derived — use it to update your row in
place instead of refetching.

Errors: `400` already settled (pass an explicit `amount` to record extra) ·
`404` no such installment · `409` installment is `CANCELLED`.

### Off-schedule / custom payment

```http
POST /api/payments
```
```jsonc
{
  "tenantLeaseId": "…",
  "amount": 2500,
  "paidDate": "2026-06-10T00:00:00.000Z",
  "type": "CUSTOM",
  "note": "late fee",
  "installmentId": null   // or attach it to a scheduled date
}
```

Use this for anything not on the schedule. It still counts toward lease and
dashboard totals (as `collectedAdHoc`).

### Correcting a payment

`PATCH /api/payments/:id` · `DELETE /api/payments/:id`

Both re-derive the affected installment(s) — including the one a payment was
*moved off* — so a correction can never leave a stale `PAID`. Delete returns
`{ success, message }`.

---

## 6. Editing the schedule

```http
PATCH /api/payments/installments/:id
```
```jsonc
{
  "dueDate": "2026-05-01T00:00:00.000Z",  // move it
  "amountDue": 35000,                     // reprice it
  "note": "tenant asked to split",        // annotate it
  "status": "WAIVED"                      // or CANCELLED / PENDING
}
```

- `WAIVED` / `CANCELLED` drop out of `totalScheduled`, `byStatus` totals and the
  collection rate, and their `balance` reads 0.
- Setting `PAID` or `PARTIAL` → **400**. They're derived.
- Repricing re-derives status immediately (raising `amountDue` above what's been
  paid flips `PAID` → `PARTIAL`).

`DELETE /api/payments/installments/:id` removes a scheduled date. **Payments
against it are kept** and become ad-hoc — the response message says how many. No
money record is ever destroyed by editing a schedule; say so in your confirm
dialog.

`POST /api/tenant-leases/:id/schedule/installments` appends a single extra date
(renewal month, late fee, one-off split) without regenerating anything.

---

## 7. Compatibility — what to watch for

**Nothing was removed or renamed.** Two additive changes can surprise a strict
client:

1. **`PaymentType` gained four values.** It was `'ANNUAL' | 'MONTHLY'`; it is now
   also `SEMI_ANNUAL`, `QUARTERLY`, `BI_MONTHLY`, `CUSTOM`. If you have a
   `Record<PaymentType, string>` label map, a `switch` without a `default`, or a
   zod enum, update it — otherwise new payments render blank or throw.

2. **`GET /api/payments/collection-tracker` gained fields** (existing fields are
   unchanged, so nothing breaks):

   ```ts
   frequency: RentFrequency | null;
   scheduled: boolean;          // false = pre-schedule lease, on the annualRent fallback
   overdueCount: number;
   nextDueDate: string | null;
   installments: {...}[];
   ```

   `annualRent` on a row now comes from the schedule when one exists, and falls
   back to the lease `annualRent` when it doesn't. Use `scheduled` to decide
   whether to offer "set up a schedule" on that row.

**Leases created before this change have no installments.** They still work
everywhere — they just report zero scheduled, don't appear in `upcoming`/`overdue`,
and their payments count as ad-hoc. Give them an empty-state CTA rather than
treating it as an error.

---

## 8. Gotchas

- **Dates are UTC.** The generator anchors due dates at UTC midnight. Format for
  display in the user's timezone, but send ISO strings back — don't send a local
  midnight that lands on the previous day in UTC.
- **Money is a float at 2 decimals.** Never compare with `===`; the server uses a
  0.005 epsilon for "fully paid". Trust `status` and `balance` rather than doing
  your own `amountPaid >= amountDue`.
- **Don't cache `isOverdue` / `daysOverdue`.** They're evaluated per request.
- **`/api/payments/*` is admin + superadmin only.** A non-admin gets `403
  FORBIDDEN`. Hide the nav item rather than letting it 403.
- **Errors follow `docs/API_CONVENTIONS.md`** — branch on `error.code`
  (`CONFLICT`, `NOT_FOUND`, `BAD_REQUEST`, `VALIDATION_FAILED`), never on
  `error.message`. Field-level validation errors arrive in `details[]`.
- **`anchorDay` maxes at 28.** Don't offer 29-31 in a day picker.
- **Max 120 installments per schedule**, so a `MONTHLY` lease longer than 10 years
  gets truncated.

---

## 9. Suggested build order

1. Lease create/edit form → add the frequency picker + optional `paymentSchedule`.
2. Lease detail → schedule table from `GET /tenant-leases/:id/schedule`, with the
   `summary` as a header strip.
3. Row actions → collect (empty-body POST), edit, waive, delete.
4. Dashboard page → `GET /payments/dashboard`: KPI tiles from `totals`, chart from
   `monthly`, two lists from `upcoming` / `overdue`, activity feed from
   `recentPayments`.
5. "All collections" table → `GET /payments/installments` with filters.
6. Custom payment modal → `POST /payments`.

Every request and response shape above is in Swagger with descriptions and
examples — generate your client from `/swagger-json` rather than hand-writing
these types.
