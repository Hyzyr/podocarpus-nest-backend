# Buyer Data Format Guide

## Overview

The contract system supports **two formats** for buyer data:

1. **Flat Format** - Easier for UI forms (recommended for frontend)
2. **Nested Format** - Used for database storage (automatically converted)

The API **automatically detects and converts** flat format to nested format, so you can send data in whichever format is most convenient.

---

## 1. Flat Format (Recommended for UI)

This format matches your UI structure with all fields at the same level.

### Example Request:

```json
POST /contracts

{
  "propertyId": "uuid",
  "investorId": "uuid",
  "contractCode": "CN-2025-001",
  "formData": {
    "leadSource": "Green List",
    "contractLanguage": "English",
    "buyer": {
      // Basic Info
      "buyerType": "Resident",
      "fullNameEn": "John Doe",
      "fullNameAr": "جون دو",
      "nationality": "Emirati",
      "isCitizenChild": false,
      "gender": "Male",

      // Identification
      "emiratesId": "784-1995-1234567-1",
      "emiratesIdExpiry": "2025-12-31T00:00:00.000Z",
      "passportNumber": "A1234567",
      "passportIssueDate": "2020-01-01T00:00:00.000Z",
      "passportExpiryDate": "2030-12-31T00:00:00.000Z",
      "passportNationality": "American",
      "dateOfBirth": "1995-05-15T00:00:00.000Z",

      // Contact Information
      "mobile": "+971501234567",
      "phone": "+97143001234",
      "email": "john@example.com",
      "country": "United Arab Emirates",
      "city": "Dubai",

      // Employment
      "currentJob": "Software Engineer",

      // Address
      "street": "Sheikh Zayed Road",
      "cityArabic": "دبي",
      "buildingName": "Burj Khalifa",
      "apartmentNo": "501",
      "zipCode": "12345",
      "poBox": "P.O. Box 123456",

      // Emergency Contact
      "emergencyContact": {
        "nameEn": "Jane Doe",
        "mobile": "+971501234568",
        "relationType": "Spouse"
      }
    }
  }
}
```

### Benefits:
- ✅ Easy to bind to UI forms
- ✅ All fields at the same level
- ✅ No nested objects for basic fields
- ✅ Matches your UI section structure

---

## 2. Nested Format (Database Storage)

This is how data is stored in the database. You can also send data in this format if needed.

### Example Request:

```json
POST /contracts

{
  "propertyId": "uuid",
  "investorId": "uuid",
  "contractCode": "CN-2025-001",
  "formData": {
    "leadSource": "Green List",
    "contractLanguage": "English",
    "buyer": {
      "buyerType": "Resident",
      "emiratesId": {
        "nameEn": "John Doe",
        "nameAr": "جون دو",
        "nationality": "Emirati",
        "isCitizenChild": false,
        "idNumber": "784-1995-1234567-1",
        "expiryDate": "2025-12-31T00:00:00.000Z",
        "dob": "1995-05-15T00:00:00.000Z",
        "gender": "Male"
      },
      "passport": {
        "number": "A1234567",
        "issueDate": "2020-01-01T00:00:00.000Z",
        "expiryDate": "2030-12-31T00:00:00.000Z",
        "nationality": "American",
        "dob": "1995-05-15T00:00:00.000Z"
      },
      "workInfo": {
        "currentJob": "Software Engineer"
      },
      "contactInfo": {
        "mobile": "+971501234567",
        "phone": "+97143001234",
        "email": "john@example.com",
        "preferredLanguage": "English"
      },
      "address": {
        "countryOfResidence": "United Arab Emirates",
        "city": "Dubai",
        "cityArabic": "دبي",
        "street": "Sheikh Zayed Road",
        "buildingName": "Burj Khalifa",
        "apartmentNo": "501",
        "zipCode": "12345",
        "poBox": "P.O. Box 123456"
      },
      "emergencyContact": {
        "nameEn": "Jane Doe",
        "mobile": "+971501234568",
        "relationType": "Spouse"
      }
    }
  }
}
```

### Benefits:
- ✅ Organized by category (ID, passport, contact, etc.)
- ✅ Better for reusability (saved to UserKycProfile)
- ✅ Cleaner database structure

---

## 3. How It Works

### Frontend (Flat) → Backend (Auto-conversion) → Database (Nested)

```
UI Form (Flat)
    ↓
API receives flat buyer
    ↓
ensureNestedBuyer() detects flat format
    ↓
Auto-converts to nested
    ↓
Validates with ContractFormDataSchema
    ↓
Saves to Contract.formData as nested JSON
```

### TypeScript Types:

```typescript
// For UI forms - use BuyerFormDto or BuyerForm
import { BuyerFormDto } from './contracts/dto/contract.dto';

// For API responses - use Buyer (nested)
import { Buyer } from './contracts/dto/contract.dto';

// Transformers available
import {
  flatToNestedBuyer,
  nestedToFlatBuyer,
  ensureNestedBuyer
} from './contracts/utils/buyer-transformer.util';
```

---

## 4. Field Mapping

| UI Field (Flat) | Database Field (Nested) |
|-----------------|-------------------------|
| `fullNameEn` | `emiratesId.nameEn` |
| `fullNameAr` | `emiratesId.nameAr` |
| `emiratesId` | `emiratesId.idNumber` |
| `emiratesIdExpiry` | `emiratesId.expiryDate` |
| `passportNumber` | `passport.number` |
| `mobile` | `contactInfo.mobile` |
| `email` | `contactInfo.email` |
| `phone` | `contactInfo.phone` |
| `city` | `address.city` |
| `street` | `address.street` |
| `zipCode` | `address.zipCode` |
| `currentJob` | `workInfo.currentJob` |

---

## 5. UI Section Mapping

Your UI structure maps perfectly to the flat format:

```
Section 1 — Buyer Details
├── Basic Info → buyerType, fullNameEn, fullNameAr, nationality, isCitizenChild
├── Identification → emiratesId, emiratesIdExpiry, passportNumber, passportIssue/ExpiryDate, dateOfBirth
├── Contact Information → mobile, phone, email, country, city
├── Employment → currentJob
└── Address → street, city, buildingName, apartmentNo, zipCode
```

---

## 6. KYC Autofill

To prefill the form with existing user data:

```typescript
GET /contracts/kyc-autofill/:userId

// Response (flat format for UI binding)
{
  "userId": "uuid",
  "kycProfileId": "uuid",
  "buyerType": "Resident",
  "fullNameEn": "John Doe",
  "emiratesId": "784-1995-1234567-1",
  "mobile": "+971501234567",
  "email": "john@example.com",
  // ... all other fields
}
```

---

## 7. Example Frontend Usage

### React Hook Form:

```typescript
import { useForm } from 'react-hook-form';
import { BuyerFormDto } from '@/types/contract.dto';

function ContractForm() {
  const { register, handleSubmit } = useForm<BuyerFormDto>();

  const onSubmit = async (data: BuyerFormDto) => {
    await fetch('/api/contracts', {
      method: 'POST',
      body: JSON.stringify({
        propertyId: 'uuid',
        investorId: 'uuid',
        contractCode: 'CN-2025-001',
        formData: {
          buyer: data // Send flat format directly!
        }
      })
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('fullNameEn')} placeholder="Full Name (English)" />
      <input {...register('emiratesId')} placeholder="Emirates ID" />
      <input {...register('mobile')} placeholder="Mobile" />
      <input {...register('email')} placeholder="Email" />
      {/* ... more fields */}
    </form>
  );
}
```

---

## Summary

- 📝 **Use flat format** for your UI forms (easier binding)
- 🔄 **Backend auto-converts** flat to nested automatically
- 💾 **Nested format stored** in database for better organization
- 🎯 **Both formats work** - use whichever is most convenient!
