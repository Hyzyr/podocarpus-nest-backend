# Contract Permissions Model

## Overview

This document describes the permission model for contract management in the Podocarpus system. The model ensures that **legal investor data** (formData) is protected from admin modifications, while allowing admins to manage **administrative fields**.

---

## Permission Matrix

### 🔒 Protected Legal Data (formData) - NOT Editable by Admins (only Superadmin)

| Section | Fields | Step | Description |
|---------|--------|------|-------------|
| `contractDetails` | buyerType, isLeadGreenList, representationType, preferredLanguage | Step 1 | Legal classification |
| `buyerDetails` | contact info, employment, address, emergency contact | Step 2 | Identity & contact data |
| `emiratesId` | ID number, name, nationality, DOB, expiry, etc. | Step 3 | Legal document |
| `passportId` | passport number, nationality, dates, etc. | Step 3 | Legal document |
| `documents` | emiratesIdCopy, passportCopy, visaCopy, etc. | Step 4 | Uploaded proofs |

> ⚠️ **Important**: Only the investor can edit formData, and only while the contract is in `draft` status.

---

### ✅ Admin/Agent Editable Fields

| Field | Description | When to Use |
|-------|-------------|-------------|
| `status` | Contract lifecycle state | Change pending → active, rejected, suspended |
| `brokerId` | Assigned broker | Assign/reassign broker to contract |
| `notes` | Internal notes | Administrative comments |
| `contractStart` | Start date | Set after approval |
| `contractEnd` | End date | Set after approval |
| `contractValue` | Total value | Confirm financial value |
| `depositPaid` | Deposit amount | Confirm deposit received |
| `investorPaymentMethod` | Payment method | Bank Transfer, Installments, etc. |
| `paymentSchedule` | Payment frequency | Monthly, Quarterly, Annual |
| `vacancyRiskLevel` | Risk assessment | Low, Medium, High |
| `fileUrl` | Signed contract URL | Set after contract is signed |
| `signedDate` | Signing date | Set after signing |

---

## API Endpoints

### Investor Endpoints

| Method | Endpoint | Description | Who Can Use |
|--------|----------|-------------|-------------|
| `POST` | `/contracts/draft` | Create a new draft contract | Investor |
| `PATCH` | `/contracts/draft/:id` | Update draft (incl. formData) | Investor (own drafts only) |
| `POST` | `/contracts/publish/:id` | Submit draft for review (draft → pending) | Investor (own drafts only) |
| `DELETE` | `/contracts/:id` | Delete contract | Investor (draft/pending only) |
| `GET` | `/contracts` | Get own contracts | Investor |
| `GET` | `/contracts/:id` | Get contract details | Investor, Admin |

### Admin/Agent Endpoints

| Method | Endpoint | Description | Who Can Use |
|--------|----------|-------------|-------------|
| `PATCH` | `/contracts/:id` | Update administrative fields only | Admin, Superadmin |
| `GET` | `/contracts/all` | Get all contracts (except drafts) | Admin, Superadmin |
| `DELETE` | `/contracts/:id` | Delete any contract | Admin, Superadmin |

---

## Contract Lifecycle

```
┌─────────┐    Investor    ┌─────────┐    Admin      ┌─────────┐
│  DRAFT  │ ───────────►   │ PENDING │ ───────────►  │ ACTIVE  │
└─────────┘    publish     └─────────┘   approve     └─────────┘
     │                           │                        │
     │                           │                        ▼
     ▼                           ▼                  ┌───────────┐
  (delete)                   (reject)               │ SUSPENDED │
                                 │                  └───────────┘
                                 ▼
                           ┌──────────┐
                           │ REJECTED │
                           └──────────┘
```

### Status Transitions

| From | To | Who Can Do |
|------|----|-----------|
| `draft` | `pending` | Investor (via publish) |
| `pending` | `active` | Admin |
| `pending` | `rejected` | Admin |
| `active` | `suspended` | Admin |
| `suspended` | `active` | Admin |

---

## Role-Based Access Summary

| Role | Create Draft | Edit formData | Edit Admin Fields | Change Status | Delete |
|------|--------------|---------------|-------------------|---------------|--------|
| **Investor** | ✅ | ✅ (draft only) | ❌ | draft→pending | draft/pending only |
| **Admin** | ❌ | ❌ | ✅ | pending→active/rejected | ✅ |
| **Superadmin** | ❌ | ❌ | ✅ | All transitions | ✅ |

---

## Frontend Integration Notes

### Route Changes Summary

1. **PATCH `/contracts/:id`** - Now **Admin-only**, uses `AdminUpdateContractDto`
   - Does NOT accept `formData`
   - Only accepts administrative fields

2. **PATCH `/contracts/draft/:id`** - For **Investors** to update draft contracts
   - Accepts `formData` changes
   - Only works when status = `draft`

3. **POST `/contracts/publish/:id`** - For **Investors** to submit drafts
   - Validates formData before publishing
   - Changes status: `draft` → `pending`

### DTOs to Use

```typescript
// For Admin updates (PATCH /contracts/:id)
interface AdminUpdateContractDto {
  status?: 'pending' | 'active' | 'rejected' | 'suspended';
  brokerId?: string;
  notes?: string;
  contractStart?: string; // ISO date
  contractEnd?: string;   // ISO date
  contractValue?: number;
  depositPaid?: number;
  investorPaymentMethod?: string;
  paymentSchedule?: string;
  vacancyRiskLevel?: string;
  fileUrl?: string;
  signedDate?: string;    // ISO date
}

// For Investor draft updates (PATCH /contracts/draft/:id)
interface UpdateDraftDto {
  formData?: ContractFormData; // Step 1-4 data
  filesUrl?: string[];
  notes?: string;
  // ... other fields
}

// For publishing (POST /contracts/publish/:id)
interface PublishContractDto {
  formData?: ContractFormData; // Optional final updates
  filesUrl?: string[];         // Optional additional files
}
```
