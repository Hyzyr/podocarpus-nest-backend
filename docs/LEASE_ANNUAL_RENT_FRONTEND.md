# Lease money model change — `annualRent` only (frontend upgrade guide)

**Shipped 2026-09-21.** `monthlyRent` no longer exists anywhere in the API.
`annualRent` is now the lease's single, **required** money field. The collection
cadence (`paymentFrequency`) and `paymentAnchorDay` are no longer stored on the
lease — the installment due dates are the truth, and every response that still
shows a `paymentFrequency` **derives it from the gaps between due dates**.

This is a breaking upgrade to the rent-collection feature. The full feature
reference is [`RENT_COLLECTION_FRONTEND.md`](RENT_COLLECTION_FRONTEND.md) (already
updated); this doc is only what changed and what you must touch.

---

## 0. TL;DR

| You need | Do this now |
| --- | --- |
| Create / edit a lease | Send **`annualRent` (required, > 0)**. Remove `monthlyRent` from forms, payloads, types. |
| Show a monthly figure | Compute it: `annualRent / 12`. The API never returns one. |
| Show a cadence chip (QUARTERLY…) | Read `paymentFrequency` from the schedule / tracker / monthly-view response. It is **derived and nullable** — `null` = no schedule yet, `CUSTOM` = hand-made/uneven dates. |
| Pick a cadence in the UI | Unchanged — still send `paymentSchedule: { frequency, anchorDay?, … }` on create, or `PUT /api/tenant-leases/{id}/schedule`. The input is just no longer echoed back from storage. |
| Read `paymentAnchorDay` back | You can't — it's gone from all responses. Keep it as **local form state** only. |
| Regenerate the API client | `/swagger-json` is current. Regenerate and let the compiler find the rest. |

---

## 1. The model

A lease carries one money number; the schedule carries the dates; payments carry
the money that arrived. Frequency is **read off the schedule**, not stored:

```
TenantLease                      RentInstallment (the schedule)
  annualRent: 48000        ┌──▶    dueDate:   2026-10-01 ─┐
  (no monthlyRent,         │       amountDue: 12000       │  gaps = 3 months
   no stored frequency) ───┘       dueDate:   2027-01-01 ─┤  ⇒ paymentFrequency
                                   dueDate:   2027-04-01 ─┤     = "QUARTERLY"
                                   dueDate:   2027-07-01 ─┘     (computed per read)
```

No enums changed values. `RentFrequency` (`ANNUAL · SEMI_ANNUAL · QUARTERLY ·
BI_MONTHLY · MONTHLY · CUSTOM`) is unchanged — what changed is that it is now a
**request input and a derived response label**, never stored lease state.

## 2. Types — what to change in yours

```ts
// The lease object (POST/PUT /api/tenant-leases, GET by id/property/active/expiring)
type TenantLease = {
  id: string;
  propertyId: string;
  tenantName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  leaseStart: string;
  leaseEnd: string | null;
  annualRent: number;              // REQUIRED now — the only money field
  // monthlyRent: number;          // ❌ removed
  // paymentFrequency: RentFrequency; // ❌ removed from the lease object
  // paymentAnchorDay: number | null; // ❌ removed
  paymentMethod: string | null;
  depositAmount: number | null;
  isActive: boolean;
  terminatedEarly: boolean;
  terminationReason: string | null;
  scheduleUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  installments?: RentInstallment[]; // on create-with-schedule responses
};

// GET /api/tenant-leases/{id}/schedule
type LeaseSchedule = {
  leaseId: string;
  propertyId: string;
  tenantName: string | null;
  // Derived from due-date gaps on every read, never stored.
  // null = lease has no schedule yet; CUSTOM = hand-made/uneven dates.
  paymentFrequency: RentFrequency | null;   // was: RentFrequency (non-null)
  // paymentAnchorDay: number | null;       // ❌ removed
  scheduleUpdatedAt: string | null;
  summary: LeaseScheduleSummary;            // unchanged
  installments: RentInstallment[];          // unchanged
};

// GET /api/payments/monthly → rows[]
//   paymentFrequency: RentFrequency        // was non-null
//   paymentFrequency: RentFrequency | null // now: null when hasSchedule=false

// GET /api/payments/collection-tracker → properties[]
//   frequency: RentFrequency | null  // now truly derived; no more fake default
//   type: 'ANNUAL' | 'MONTHLY' | null // legacy hint — now always 'ANNUAL' or null
```

## 3. Workflows that changed

### Creating a lease (only the body changed)

```http
POST /api/tenant-leases            (auth: any logged-in user; cookie JWT)
```
```jsonc
{
  "propertyId": "7d29efff-9bf9-4afd-a252-5890f91e6c36",
  "tenantName": "Ahmed Khan",
  "leaseStart": "2026-10-01T00:00:00.000Z",
  "leaseEnd": "2027-09-30T00:00:00.000Z",   // optional — omit for open-ended
  "annualRent": 48000,                       // REQUIRED, must be > 0
  "paymentSchedule": {                       // optional, unchanged shape
    "frequency": "QUARTERLY",
    "anchorDay": 1                           // optional; input only, never echoed back
  }
}
```

Real response (201, abridged): the lease object above with
`"annualRent": 48000`, **no** `monthlyRent`/`paymentFrequency`/`paymentAnchorDay`
keys at all, and `installments: [4 × { amountDue: 12000, … }]`.

Omitting `annualRent` → `400` with `code: "VALIDATION_FAILED"`.
`PUT /api/tenant-leases/{id}` takes the same fields, all optional.

### Setting / replacing the schedule — **request unchanged**

`PUT /api/tenant-leases/{id}/schedule` still takes
`{ frequency, anchorDay?, annualAmount?, firstDueDate?, count?, installments? }`.
`annualAmount` now defaults to the lease `annualRent` (there is no
`monthlyRent × 12` fallback anymore — but `annualRent` is required, so the
default always exists). The response is the `LeaseSchedule` above, where
`paymentFrequency` is what the server *inferred back* from the dates it just
generated — for a generated schedule it always equals the frequency you sent.

### Reading — where the derived frequency shows up

- `GET /api/tenant-leases/{id}/schedule` → `paymentFrequency` derived, no anchor.
- `GET /api/payments/monthly` → `rows[].paymentFrequency` derived, `null` when
  `hasSchedule` is `false`.
- `GET /api/payments/collection-tracker?year=` → `properties[].frequency` derived
  **from the lease's whole schedule** (not just the requested year), so an
  Oct-start quarterly lease still reads `QUARTERLY` in a year that only contains
  one of its due dates.

## 4. Compatibility — field by field

**Removed from requests** (`POST`/`PUT /api/tenant-leases`):

| Field | What happens if you still send it |
| --- | --- |
| `monthlyRent` | Silently stripped (server whitelists bodies) — no error, no effect. The danger is the opposite: forgetting to add `annualRent` fails with 400 `VALIDATION_FAILED`. |

**Removed from responses:**

| Endpoint | Removed keys |
| --- | --- |
| Every endpoint returning a lease object | `monthlyRent`, `paymentFrequency`, `paymentAnchorDay` |
| `GET /api/tenant-leases/{id}/schedule` | `paymentAnchorDay` |

**Nullability changes** (these break strict zod/TS parsing, not runtime JS):

| Endpoint | Field | Before | After |
| --- | --- | --- | --- |
| `…/{id}/schedule` | `paymentFrequency` | `RentFrequency` | `RentFrequency \| null` |
| `/api/payments/monthly` rows | `paymentFrequency` | `RentFrequency` | `RentFrequency \| null` |
| `/api/payments/collection-tracker` rows | `frequency` | already nullable | unchanged shape, but no longer shows a fake `ANNUAL` default for unconfigured leases — it is `null` until a schedule exists |

**Pre-existing records:** the migration backfilled every lease with
`annualRent = monthlyRent × 12`, so no lease has a missing `annualRent` and no
frontend backfill/empty-state work is needed. Leases that never had a schedule
show `paymentFrequency: null` — treat that as your "set up collection dates"
empty state (same signal as `hasSchedule: false` / `scheduled: false`).

**Semantics, unchanged but easy to miss:** a recorded payment's `type`
(`QUARTERLY` etc.) is now derived from the installment's own covered period
rather than the lease's stored frequency — for generated schedules the values
come out the same as before; ad-hoc installments without a period record as
`CUSTOM`.

## 5. Gotchas

- **`null` ≠ `CUSTOM`.** `paymentFrequency: null` means *no schedule exists*;
  `"CUSTOM"` means *a schedule exists with uneven/hand-picked dates*. Don't
  collapse them into one chip.
- **A one-installment schedule reads as `ANNUAL`** — with a single due date
  there is no gap to measure. This is intended; don't file it as a bug.
- **Monthly figures are yours to compute** — `annualRent / 12`, and round for
  display only. Never send a monthly number back to the API.
- **`anchorDay` is write-only now.** If your edit-schedule form used to
  pre-fill it from the lease, it can't; either keep it in local state or leave
  the field blank on re-edit (the due dates themselves carry the information).
- Money is still float-with-2dp server-side; ordering, rounding-remainder
  ("last installment of a cycle absorbs the remainder"), and all error `code`s
  are unchanged from `RENT_COLLECTION_FRONTEND.md`.

## 6. Suggested build order (each step shippable)

1. **Regenerate the API client from `/swagger-json`** and fix what the compiler
   flags — that alone covers the type/nullability changes.
2. **Lease create/edit form:** replace the monthly-rent input with an annual-rent
   input (required, > 0); anywhere the UI showed monthly, render
   `annualRent / 12` with a "/mo" label.
3. **Frequency chips** (tracker, monthly table, schedule page): handle `null`
   ("no schedule") and keep `CUSTOM` distinct.
4. **Remove dead code:** `monthlyRent` in types, mappers, mocks, zod schemas,
   and any `paymentAnchorDay` read-back.

Source of truth is the live **`/swagger-json`** — regenerate the client rather
than hand-editing types; every change above is visible in the spec.
