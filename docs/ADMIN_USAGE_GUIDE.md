# Admin Usage Guide — Tenants & Payments

> **Base URL:** `http://your-server:3030/api`  
> **Auth:** All endpoints require an admin or superadmin JWT cookie (set after login).  
> **Swagger:** Full interactive docs at `/swagger`

---

## 1. Tenant Leases

### 1.1 Add a Tenant to a Property

**`POST /api/tenant-leases`**

```json
{
  "propertyId": "uuid-of-property",
  "tenantName": "IMAD ALDEEN A.",
  "tenantEmail": "imad@example.com",
  "tenantPhone": "+971501234567",
  "leaseStart": "2026-01-01",
  "leaseEnd": "2026-12-31",
  "monthlyRent": 3667,
  "annualRent": 44000,
  "paymentMethod": "Bank Transfer",
  "depositAmount": 5000
}
```

**Notes:**
- `propertyId` — required. UUID of the property.
- `monthlyRent` — required. Used as fallback for collection tracker if `annualRent` is not set.
- `annualRent` — optional but recommended. Set this so the collection tracker shows the correct annual target.
- `leaseEnd` — optional. Leave blank for open-ended leases.
- Creating a lease automatically marks the property as **occupied**.
- Returns 400 if there is already an overlapping active lease on the same property.

---

### 1.2 Get All Leases for a Property

**`GET /api/tenant-leases/property/:propertyId`**

Returns all lease history for that property (active and past), newest first.

---

### 1.3 Get a Single Lease

**`GET /api/tenant-leases/:id`**

---

### 1.4 Get All Active Leases (portfolio-wide)

**`GET /api/tenant-leases/active`**

---

### 1.5 Get Leases Expiring Soon

**`GET /api/tenant-leases/expiring?daysAhead=30`**

Returns active leases that expire within `daysAhead` days (default: 30).

---

### 1.6 Update a Lease

**`PUT /api/tenant-leases/:id`**

All fields are optional — send only what changed:

```json
{
  "annualRent": 48000,
  "leaseEnd": "2027-01-01"
}
```

---

### 1.7 Terminate a Lease Early

**`POST /api/tenant-leases/:id/terminate`**

Use this when the tenant leaves before the lease end date. The lease is marked inactive and the property becomes vacant again.

```json
{
  "reason": "Tenant requested early termination"
}
```

---

### 1.8 Delete a Lease

**`DELETE /api/tenant-leases/:id`**

Permanently deletes the lease record. The property is automatically marked as vacant.

> Use **terminate** when the tenant left early but you want to keep the history.  
> Use **delete** only if the lease was entered by mistake.

---

## 2. Payments

### 2.1 Record a Payment

**`POST /api/payments`**

```json
{
  "tenantLeaseId": "uuid-of-lease",
  "amount": 44000,
  "paidDate": "2026-03-01",
  "type": "ANNUAL",
  "note": "Full year paid upfront"
}
```

- `type` — `"ANNUAL"` or `"MONTHLY"`
- `note` — optional, max 500 characters
- `tenantLeaseId` — get this from the lease object when you load the property

---

### 2.2 Edit a Payment (fix a mistake)

**`PATCH /api/payments/:id`**

Send only the fields you want to change:

```json
{
  "amount": 22000,
  "note": "Corrected — first installment only"
}
```

---

### 2.3 Delete a Payment

**`DELETE /api/payments/:id`**

---

### 2.4 List Payments for a Lease

**`GET /api/payments/lease/:leaseId`**

Returns all payments for one lease, newest first.

---

### 2.5 List Payments for a Property

**`GET /api/payments/property/:propertyId`**

Returns all payments across all leases for a property, newest first. Each payment includes:

```json
{
  "id": "...",
  "amount": 11000,
  "paidDate": "2026-01-01T00:00:00.000Z",
  "type": "ANNUAL",
  "note": null,
  "tenantLease": {
    "tenantName": "IMAD ALDEEN A.",
    "propertyId": "..."
  }
}
```

---

## 3. Collection Tracker

**`GET /api/payments/collection-tracker?year=2026`**

The main dashboard endpoint. Returns every property with its tenant, expected rent, collected amount, and individual payments — all in one call.

### Full response shape:

```json
{
  "year": 2026,
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
        { "id": "uuid", "amount": 11000, "paidDate": "2026-01-01T...", "type": "ANNUAL", "note": null },
        { "id": "uuid", "amount": 11000, "paidDate": "2026-04-01T...", "type": "ANNUAL", "note": null }
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

**Vacant properties** have `tenant: null`, `annualRent: null`, `percent: null`. Show "VACANT" in the UI for these.

**Annual rent fallback:** if `annualRent` is not set on the lease, the tracker uses `monthlyRent × 12` automatically.

---

## 4. Typical Admin Workflow

```
1. Open property page
       │
       ▼
2. Create tenant lease  →  POST /api/tenant-leases
   (with annualRent field set)
       │
       ▼
3. Add payments as they come in  →  POST /api/payments
   (amount + date + ANNUAL or MONTHLY)
       │
       ▼
4. Check collection tracker  →  GET /api/payments/collection-tracker?year=2026
   (see paid vs remaining across all 29 properties)
       │
       ▼
5. When tenant leaves:
   ├── Early exit  →  POST /api/tenant-leases/:id/terminate
   └── Lease ended normally  →  PUT /api/tenant-leases/:id  { isActive: false }
```

---

## 5. Charts You Can Build from This Data

All charts read from data you already have. **No extra endpoints needed.**

---

### 5.1 Collection Rate — Donut / Gauge

**Source:** `summary.collectionRate` from collection tracker

```
Collected: 32%   ████████░░░░░░░░░░░░░░░░   Remaining: 68%
```

| Value | Field |
|-------|-------|
| Collected % | `summary.collectionRate` |
| Remaining % | `100 - summary.collectionRate` |
| Total expected | `summary.totalAnnualRent` |
| Total collected | `summary.totalCollected` |

---

### 5.2 Occupancy — Pie Chart

**Source:** `summary` from collection tracker

```
Occupied: 24   ████████████░░░   Vacant: 5
```

| Slice | Field |
|-------|-------|
| Occupied | `summary.occupied` |
| Vacant | `summary.vacant` |

---

### 5.3 Per-Property Collection — Horizontal Bar Chart

**Source:** `properties[]` from collection tracker

One bar per property. Each bar shows collected vs remaining.

```
Al Jawhara 1107   ████████████████████ 100%
Al Jawhara 1307   ██████████░░░░░░░░░░  50%
Dynasty T. 307B   ██████████░░░░░░░░░░  50%
Marina Ar. 2010   █░░░░░░░░░░░░░░░░░░░   8%
```

| Bar segment | Field |
|-------------|-------|
| Filled (collected) | `property.collected` |
| Empty (remaining) | `property.remaining` |
| Label | `property.percent + "%"` |

Skip vacant rows (`property.tenant === null`).

---

### 5.4 Monthly Revenue — Bar Chart

**Source:** `properties[].payments[]` — group by month

Call `GET /api/payments/collection-tracker?year=2026`, then flatten all `payments` arrays and group by `paidDate` month.

```javascript
// Example grouping
const monthly = {};
for (const prop of response.properties) {
  for (const p of prop.payments) {
    const month = p.paidDate.slice(0, 7); // "2026-01"
    monthly[month] = (monthly[month] ?? 0) + p.amount;
  }
}
// Result: { "2026-01": 120000, "2026-02": 85000, ... }
```

```
Jan   ████████████  120,000 AED
Feb   █████████      85,000 AED
Mar   ██████████    100,000 AED
```

---

### 5.5 Per-Property Payment Timeline — Bar Chart

**Source:** `GET /api/payments/property/:propertyId`

Show one bar per payment for a single property. Good for the property detail page.

```
Al Jawhara 1107 — 2026

Apr   ████  11,000 AED
Aug   ████  11,000 AED
Nov   ████  11,000 AED
Feb   ████  11,000 AED (next year)
```

---

### 5.6 Occupancy Over Time — Line Chart *(future)*

Not available yet — requires historical lease data. Can be built once soft-delete / lease history is tracked.

---

### Summary Table

| Chart | Endpoint | Key fields |
|-------|----------|------------|
| Collection rate donut | `collection-tracker` | `summary.collectionRate` |
| Occupancy pie | `collection-tracker` | `summary.occupied`, `summary.vacant` |
| Per-property bars | `collection-tracker` | `properties[].collected`, `.remaining`, `.percent` |
| Monthly revenue bars | `collection-tracker` (flatten payments) | `payments[].amount`, `.paidDate` |
| Property timeline | `payments/property/:id` | `amount`, `paidDate` |

---

*End of Guide*
