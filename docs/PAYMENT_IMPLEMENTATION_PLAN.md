# Payment Tracking — Simple Implementation Plan

> **Date:** March 2026  
> **Scope:** Admin records rent payments (amount + date). Collection tracker table shows paid vs outstanding.  
> **Approach:** Keep it minimal. Grow later.

---

## 1. How It Works

**Admin flow — 3 steps:**

1. Admin opens a property → sees the tenant lease with annual rent
2. Admin clicks "Add Payment" → enters **amount**, **date**, and picks **Annual** or **Monthly**
3. The payment is saved. The collection tracker table updates automatically.

That's it. No schedules, no statuses, no bank routing. Just a payment log.

---

## 2. Data Model (Prisma)

### 2.1 One new enum

```prisma
enum PaymentType {
  ANNUAL
  MONTHLY
}
```

### 2.2 One new model: `RentPayment`

```prisma
model RentPayment {
  id             String      @id @default(uuid())
  tenantLeaseId  String

  amount         Float                // How much was paid (AED)
  paidDate       DateTime             // When it was paid
  type           PaymentType          // ANNUAL or MONTHLY
  note           String?              // Optional note from admin

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  recordedById   String?              // Which admin entered this

  tenantLease    TenantLease @relation(fields: [tenantLeaseId], references: [id], onDelete: Cascade)
  recordedBy     AppUser?    @relation("PaymentRecorder", fields: [recordedById], references: [id], onDelete: SetNull)

  @@index([tenantLeaseId])
  @@index([paidDate])
}
```

### 2.3 Add `annualRent` to TenantLease

One new nullable field on the existing model:

```prisma
model TenantLease {
  // ... existing fields stay unchanged ...

  annualRent  Float?    // NEW — expected total rent for the year

  payments    RentPayment[]  // NEW relation
}
```

### 2.4 Add relation to AppUser

```prisma
model AppUser {
  // ... existing fields ...

  recordedPayments  RentPayment[]  @relation("PaymentRecorder")  // NEW
}
```

### Relationships

```
Property  1──n  TenantLease  1──n  RentPayment
                                       └── n──1 AppUser (recordedBy)
```

---

## 3. API Endpoints

Only 5 endpoints. All admin-only.

| Method | Path | What it does |
|---|---|---|
| `POST` | `/api/payments` | Record a new payment |
| `GET` | `/api/payments/lease/:leaseId` | List payments for a lease |
| `GET` | `/api/payments/property/:propertyId` | List payments for a property |
| `PATCH` | `/api/payments/:id` | Edit a payment (fix amount/date) |
| `DELETE` | `/api/payments/:id` | Delete a payment |

### POST /api/payments — Record a payment

**Request body:**

```json
{
  "tenantLeaseId": "uuid-of-lease",
  "amount": 60000,
  "paidDate": "2025-01-15",
  "type": "ANNUAL",
  "note": "Paid in full for 2025"
}
```

**Response:**

```json
{
  "id": "uuid",
  "tenantLeaseId": "uuid-of-lease",
  "amount": 60000,
  "paidDate": "2025-01-15T00:00:00.000Z",
  "type": "ANNUAL",
  "note": "Paid in full for 2025",
  "recordedById": "admin-uuid",
  "createdAt": "2025-03-25T..."
}
```

### GET /api/payments/property/:propertyId

Returns all payments for all leases on that property, sorted by date.

```json
[
  { "id": "...", "amount": 5000, "paidDate": "2025-01-15", "type": "MONTHLY", "note": null },
  { "id": "...", "amount": 5000, "paidDate": "2025-02-15", "type": "MONTHLY", "note": null },
  { "id": "...", "amount": 5000, "paidDate": "2025-03-15", "type": "MONTHLY", "note": "Late by 2 days" }
]
```

---

## 4. DTOs & Validation

### CreatePaymentDto

```typescript
export class CreatePaymentDto {
  @IsUUID()
  tenantLeaseId: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  paidDate: string;

  @IsEnum(['ANNUAL', 'MONTHLY'])
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
```

### UpdatePaymentDto

```typescript
export class UpdatePaymentDto {
  @IsOptional() @IsNumber()      amount?: number;
  @IsOptional() @IsDateString()  paidDate?: string;
  @IsOptional() @IsEnum(['ANNUAL', 'MONTHLY']) type?: string;
  @IsOptional() @IsString()      note?: string;
}
```

---

## 5. Module Structure

```
src/payments/
├── payments.module.ts       # Module definition
├── payments.controller.ts   # 5 endpoints
├── payments.service.ts      # CRUD logic
└── dto/
    └── payment.dto.ts       # Create + Update DTOs
```

Register in `app.module.ts` → add `PaymentsModule` to imports.

---

## 6. Implementation Steps

### Step 1 — Schema + Migration

- [ ] Add `PaymentType` enum to `schema.prisma`
- [ ] Add `RentPayment` model
- [ ] Add `annualRent` field + `payments` relation to `TenantLease`
- [ ] Add `recordedPayments` relation to `AppUser`
- [ ] Run `npx prisma migrate dev --name add_payments`
- [ ] Run `npx prisma generate`

### Step 2 — Payment Module

- [ ] Create `src/payments/payments.module.ts`
- [ ] Create `src/payments/dto/payment.dto.ts`
- [ ] Create `src/payments/payments.service.ts` (create, findByLease, findByProperty, update, delete)
- [ ] Create `src/payments/payments.controller.ts` (5 endpoints, admin-only guards)
- [ ] Register in `app.module.ts`

### Step 3 — Collection Tracker (see DASHBOARD_CHARTS_PLAN.md)

- [ ] Add `GET /api/payments/collection-tracker?year=2025` endpoint
- [ ] Query all properties → leases → payments → compute totals

### Step 4 — Seed test data

- [ ] Enter a few payments via the API or seed script
- [ ] Verify collection tracker totals

---

### Future Growth (not now)

When needed later, these can be added without changing the core:

- **Payment method** (cheque / transfer / cash) — add a field to `RentPayment`
- **Bank name** (FAB, EIB) — add a field
- **Payment status** (scheduled, overdue, bounced) — add an enum field
- **Auto schedule generation** — generate future payment rows from lease terms
- **Rent escalation** — new model for multi-year rent changes
- **Reports** — bank breakdown, overdue aging, monthly totals

Each is just adding a field or a new endpoint — the base model supports it.

---

*End of Plan*
