# Building the Monthly Payments Tables

Date: 2026-09-15
Endpoint: `GET /api/payments/monthly` · Swagger: `/swagger`
API reference: [`RENT_COLLECTION_FRONTEND.md` §4b](RENT_COLLECTION_FRONTEND.md)

That file is the API contract. **This one is how to build the UI on top of it** —
layout, what to draw in each cell, and the cases that will otherwise look like
bugs.

---

## 1. What you're building

Three views, all from the **same single request**. Don't fetch three times.

| View | Scope | Answers |
|---|---|---|
| **A — Portfolio rent roll** | all tenants × 12 months | "who has paid, who hasn't" |
| **B — Tenant ledger** | one tenant × 12 months | "this tenant's year in detail" |
| **C — Month cell detail** | one tenant × one month | "exactly what happened here" |

B is A with `?leaseId=…`. C needs no request at all — the data is already in the
cell you clicked.

```
GET /api/payments/monthly?year=2026                    → View A
GET /api/payments/monthly?year=2026&leaseId=<id>       → View B
cell = rows[r].cells[c]                                → View C
```

---

## 2. The shape, in one look

```
response
├─ months[]   ← column headers AND the footer totals row
├─ rows[]     ← one per tenant
│   ├─ tenantName / buildingName / unitNo / propertyTitle
│   ├─ paymentFrequency, hasSchedule, isActive
│   ├─ totals    ← the row's right-hand summary column
│   └─ cells[]   ← ALIGNED WITH months[] BY INDEX
└─ totals     ← grand total, bottom-right corner
```

```
              Jan    Feb    Mar    Apr   …   │ Total
─────────────────────────────────────────────┼────────
Ahmed · 1204  ✅30k    –      –    ✅30k  …   │ 120k  ← rows[0]
Sara  · 0907  ✅10k  ✅10k  ⚠️4k   🔴10k  …   │  98k  ← rows[1]
─────────────────────────────────────────────┼────────
Total          40k    10k     4k    40k  …   │ 218k  ← months[] + totals
```

`rows[i].cells[j]` always corresponds to `months[j]`. Index by position:

```ts
row.cells.map((cell, j) => renderCell(cell, months[j]))
```

**Never** `cells.find(c => c.month === m)` and never bucket anything yourself.
Cells are never sparse — a `QUARTERLY` tenant has eight `NONE` cells a year, and
that's exactly what keeps the columns aligned.

---

## 3. How to render a cell

Two inputs decide it: **where the column sits in time** (`isPast` / `isCurrent` /
`isFuture`) and **the cell's status**.

| Column | `status` | Meaning | Render |
|---|---|---|---|
| any | `PAID` | Settled | ✅ `amountDue`, green, muted |
| any | `PARTIAL` | Part paid, balance left | ⚠️ `amountPaid` / `amountDue`, amber, show `balance` |
| past / current | `OVERDUE` | Unsettled, past its date | 🔴 `balance` + `daysOverdue` days late |
| current | `PENDING` | Due this month, not yet late | ● `amountDue` + due date, neutral |
| future | `PENDING` | Upcoming | ○ `amountDue` + due date, outlined/faint |
| any | `WAIVED` | Forgiven by an admin | strikethrough `amountDue`, grey, tooltip `note` |
| any | `CANCELLED` | No longer applies | grey dash, tooltip `note` |
| any | `AD_HOC` | Unscheduled money (late fee) | `+adHocInMonth`, neutral/blue, no target |
| any | `NONE` | **Nothing was due** | see below — usually a dash |

### The `NONE` cell is where bugs come from

`NONE` means *nothing was owed for this month*. It does **not** mean nothing
happened. A `NONE` cell with `receivedInMonth > 0` is another month's rent
landing here — most often a late payment.

```
2026-04  PAID   amountDue 30000  amountPaid 30000  receivedInMonth 0       ← owed & met
2026-06  NONE   amountDue     0  amountPaid     0  receivedInMonth 30000   ← the cash
```

Both rows are correct. April's obligation *was* met; the money simply arrived in
June. **If you render cells purely from `status`, that 30,000 disappears from the
table.** Always fall through to `receivedInMonth`:

```tsx
function Cell({ cell, col }: { cell: MonthlyCell; col: MonthlyColumn }) {
  if (cell.status !== 'NONE') return <StatusCell cell={cell} col={col} />;
  if (cell.receivedInMonth > 0) return <ReceivedOnly cell={cell} />;  // ← don't skip
  return <Dash />;
}
```

### Naming it properly: "30,000 — for April"

Everything needed to resolve that is already in the response. Build one index
over the whole payload, then any payment can name the month it settles:

```ts
/** installmentId → the month its installment is due in. */
function installmentMonthIndex(res: MonthlyView) {
  const index = new Map<string, string>();
  for (const row of res.rows)
    for (const cell of row.cells)
      for (const inst of cell.installments) index.set(inst.id, cell.month);
  return index;
}

// in a NONE / AD_HOC cell:
const labels = cell.payments?.map(p =>
  p.installmentId ? `for ${index.get(p.installmentId) ?? 'another month'}` : 'ad-hoc',
);
```

No extra request. Do it once per response, not per cell.

### A cell can hold more than one installment

`CUSTOM` schedules, or an extra date added via
`POST /tenant-leases/:id/schedule/installments`, can put two collections in one
month. `amountDue` / `amountPaid` / `balance` are already summed, and `status` is
the worst case across them. Render the summed figures; show the breakdown from
`cell.installments` in the detail view (§6).

### Combinations that cannot occur

Don't write branches for these:

- **`PENDING` in a past column.** If a due date has passed with a balance
  outstanding, the server returns `OVERDUE`. A past `PENDING` is impossible.
- **`isOverdue` in a future column.** Nothing future is late.
- **`daysOverdue > 0` while `isOverdue` is false.** It's 0 whenever not overdue.
- **Non-zero `balance` on `WAIVED` / `CANCELLED`.** Forced to 0 server-side.

---

## 4. View A — the portfolio rent roll

### Layout

```
┌──────────────┬────┬────┬────┬─ … ─┬────────┐
│ Tenant       │Jan │Feb │Mar │     │ Totals │  ← sticky header
├──────────────┼────┼────┼────┼─ … ─┼────────┤
│ Ahmed · 1204 │ ✅ │ –  │ –  │     │  120k  │  ← sticky first column
│ Sara  · 0907 │ ✅ │ ✅ │ ⚠️ │     │   98k  │
├──────────────┼────┼────┼────┼─ … ─┼────────┤
│ Total        │40k │10k │ 4k │     │  218k  │  ← sticky footer
└──────────────┴────┴────┴────┴─ … ─┴────────┘
   sticky          horizontally scrollable       sticky
```

Twelve month columns don't fit a laptop viewport alongside a tenant label. Make
the first column and the header/footer sticky, and let the months scroll
horizontally. On mobile, drop to a month-picker plus a single-month list — a
12-column grid is not worth rescuing on a phone.

### The footer is already computed

`months[j]` carries `scheduled`, `collected`, `received`, `outstanding`,
`overdueAmount`, and `dueCount` / `paidCount` / `partialCount` / `pendingCount` /
`overdueCount`. `totals` is the bottom-right corner. **Do no arithmetic in the
component** — if a number you want isn't there, ask for it rather than summing
client-side, because the server excludes `WAIVED`/`CANCELLED` from `scheduled` in
a way that's easy to get wrong.

### Row identity

`tenantName` is nullable. Build the label defensively:

```ts
const label = [row.tenantName, row.unitNo && `Unit ${row.unitNo}`, row.buildingName]
  .filter(Boolean).join(' · ') || row.propertyTitle || 'Unnamed lease';
```

Show `paymentFrequency` as a small chip on the row (it is derived from the
schedule's due-date gaps and is `null` when the lease has no schedule) — it
explains at a glance why
a `QUARTERLY` tenant's row is mostly empty, which otherwise reads as missing data.

### Sorting and filtering (client-side, on `rows`)

The response is small enough to sort in the browser. Useful orders:

- **Most overdue first** — `row.totals.overdueAmount` desc (the default for a
  collections screen)
- **Worst collection rate** — `row.totals.collectionRate` asc, ignoring rows
  where `scheduled === 0`
- **By building / unit** — the natural rent-roll order

Server-side filters worth wiring to the toolbar: `propertyId`, `activeLeasesOnly`,
`hideEmptyRows`, and the year / `from`-`to` window.

---

## 5. View B — the tenant ledger

Same endpoint with `?leaseId=…`, rendered vertically: one row per month, room for
detail.

| Month | Due date | Due | Paid | Balance | Status | Payments |
|---|---|---|---|---|---|---|
| Jan 2026 | 1 Jan | 30,000 | 30,000 | 0 | PAID | 30,000 · 5 Jan · Bank Transfer |
| Apr 2026 | 1 Apr | 30,000 | 30,000 | 0 | PAID | 30,000 · 20 Jun · Cheque *(late)* |
| May 2026 | — | — | — | — | — | 500 · 11 May · late fee |
| Jul 2026 | 1 Jul | 30,000 | 12,000 | 18,000 | OVERDUE 76d | 12,000 · 2 Jul |
| Oct 2026 | 1 Oct | 30,000 | — | 30,000 | PENDING | — |

Take the due date from `cell.installments[0].dueDate` (or list all of them when a
month holds several). Flag a payment as late by comparing `payment.paidDate` with
its installment's `dueDate` — both are in the payload.

Skipping `NONE` months with no activity is fine here; in view A it is not,
because the columns must stay aligned.

---

## 6. View C — the cell detail

Clicking a cell opens a drawer. **No fetch** — you already have everything:

```ts
{
  cell.installments.map(i => ({
    sequence: i.sequence, dueDate: i.dueDate,
    amountDue: i.amountDue, amountPaid: i.amountPaid, balance: i.balance,
    status: i.status, note: i.note,
    period: [i.periodStart, i.periodEnd],
    payments: i.payments,          // what settled THIS installment
  }))
}
cell.payments   // everything that ARRIVED in this month, incl. other months' rent
```

Two lists, two headings, and label them plainly — *"Due this month"* and
*"Received this month"*. Don't merge them; that's the distinction the whole
design rests on.

Actions in the drawer, per installment:

| Action | Call |
|---|---|
| Mark paid | `POST /api/payments/installments/:id/collect` with `{}` |
| Record partial | same, `{ amount, paidDate, method, reference, note }` |
| Edit / move / reprice | `PATCH /api/payments/installments/:id` |
| Waive / cancel | `PATCH …` with `{ status: 'WAIVED' \| 'CANCELLED', note }` |
| Add off-schedule money | `POST /api/payments` with `tenantLeaseId` |

### Updating after a collect

`collect` returns `{ payment, installment }` with the installment **already
re-derived**. Patch it into the cached cell rather than refetching the grid:

```ts
const { payment, installment } = await collect(id);

setGrid(prev => mapCell(prev, installment.tenantLeaseId, installment.id, cell => ({
  ...cell,
  installments: cell.installments.map(i => i.id === installment.id ? installment : i),
})));
```

One caveat: the cell's own `amountPaid` / `balance` / `status` **and** the column
and grand totals are server-computed, so a local patch leaves them stale. Either
recompute those few fields yourself from the cell's installments, or invalidate
the query after the drawer closes. Refetching once on close is simpler and
usually fast enough — patch for instant feedback, invalidate on close for truth.

---

## 7. Performance

- **The grid doesn't need payment records.** Pass `includePayments=false` for
  view A; the payload drops a lot and `status` / `balance` / `receivedInMonth`
  are all still there. Fetch the detail with `leaseId` when a drawer opens, or
  load the full payload once if your portfolio is small.
- **The window is capped at 120 columns.** A `from`/`to` spanning more is
  truncated, not rejected.
- **Virtualize rows** past ~100 tenants. Columns are at most 12 in the normal
  case — not worth virtualizing.
- **Cache key must include every filter**: `['payments-monthly', year, from, to,
  propertyId, leaseId, activeLeasesOnly, hideEmptyRows, includePayments]`.
  Dropping `includePayments` from the key is a classic bug — the lightweight
  grid response gets served to the detail view and `payments` is missing.

---

## 8. States

| State | What to show |
|---|---|
| Loading | Skeleton grid — you know the column count from the year |
| No rows at all | "No tenant leases in this period." Offer the year picker; the default is the current year and a new system has nothing in it. |
| `row.hasSchedule === false` | **Don't render twelve empty cells.** Span the row with "No collection dates set" + a link to `PUT /tenant-leases/:id/schedule`. These are pre-existing leases; it's the single most common empty state right now. |
| `row.isActive === false` | Render it (past tenants keep their history) but mute it and mark it "ended". Add an "active only" toggle → `activeLeasesOnly=true`. |
| Error | Read `error.code`, never `error.message`. `403 FORBIDDEN` → not an admin; hide the nav entry instead of showing the error. |

---

## 9. Worked example

Real output from the backend smoke test — a `QUARTERLY` tenant, 120,000/year,
where **April's rent was paid in June**, a late fee landed in May, and Q3 was
only part paid. `today = 2026-09-15`:

```
month    column   status    amountDue  amountPaid  receivedInMonth  adHoc  overdue
2026-01  past     PAID          30000       30000            30000      0   -
2026-02  past     NONE              0           0                0      0   -
2026-03  past     NONE              0           0                0      0   -
2026-04  past     PAID          30000       30000                0      0   -     ← owed, met
2026-05  past     AD_HOC            0           0              500    500   -     ← late fee
2026-06  past     NONE              0           0            30000      0   -     ← April's cash
2026-07  past     OVERDUE       30000       12000            12000      0   76d
2026-08  past     NONE              0           0                0      0   -
2026-09  CURRENT  NONE              0           0                0      0   -
2026-10  future   PENDING       30000           0                0      0   -
2026-11  future   NONE              0           0                0      0   -
2026-12  future   NONE              0           0                0      0   -

totals: scheduled 120000 · collected 72000 · received 72500
        outstanding 48000 · overdue 1 / 18000 · rate 60%
```

Sanity checks for your renderer:

- April must read **paid**, not empty — even though nothing arrived that month.
- June must show **30,000**, not a dash — even though its status is `NONE`.
- May's `AD_HOC` 500 is **not** counted in `scheduled`, so it must not appear in a
  "paid vs target" bar.
- `scheduled` is 120,000 = 4 × 30,000, and `collected` 72,000 = 30k + 30k + 12k.
  `received` is 72,500 — 500 more, because the late fee arrived but was never
  owed. If your footer shows 72,500 against a 120,000 target, you've used the
  wrong field.

---

## 10. Checklist

- [ ] Cells indexed by position against `months`, never searched by month string
- [ ] `NONE` cells with `receivedInMonth > 0` still show the money
- [ ] All totals read from `months[]` / `row.totals` / `totals` — no client maths
- [ ] `isPast` / `isCurrent` / `isFuture` drive the treatment; nothing future is late
- [ ] `hasSchedule: false` rows get a CTA, not twelve blanks
- [ ] Inactive leases visible but muted, with an "active only" toggle
- [ ] `includePayments=false` for the grid; full payload for the detail
- [ ] `includePayments` is part of the cache key
- [ ] Collect uses an **empty body** and patches the returned installment in
- [ ] `WAIVED` / `CANCELLED` shown as closed, excluded from any "target" bar
- [ ] Sticky first column, header and footer; horizontal scroll on months
- [ ] Money formatted from numbers as-is (server rounds to 2dp); never compared with `===`
- [ ] Dates rendered in the user's timezone, sent back as ISO

---

Generate your types from `/swagger-json` rather than copying the shapes here —
every field carries a description and example in the spec.
