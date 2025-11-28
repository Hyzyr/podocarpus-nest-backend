# Contract Form Data & KYC Autofill Implementation

## Overview

This document describes the implementation of the contract creation system with full form data support and KYC autofill functionality. The system allows storing comprehensive buyer information in JSON fields while maintaining a clean, scalable architecture.

---

## 🎯 Features

### 1. **Full Contract Form Data Storage**
- Store complete buyer information (Emirates ID, Passport, Work Info, etc.) in `Contract.formData` JSON field
- Support for multiple buyers per contract
- Flexible schema that can evolve without database migrations

### 2. **KYC Autofill**
- Pre-populate contract forms with user's saved KYC profile data
- Save contract form data back to KYC profile for future use
- Fast form completion for returning users

### 3. **Zod Schema Validation**
- Runtime validation of form data structure
- Type-safe TypeScript interfaces
- Clear error messages for invalid data

---

## 📂 File Structure

```
src/contracts/
├── dto/
│   └── contract.dto.ts          # DTOs + Zod schemas (570 lines)
├── services/
│   └── contracts.service.ts     # Service with KYC methods
└── contracts.controller.ts      # Controller with new routes
```

---

## 🗂️ Database Schema

### Contract Model (Prisma)

```prisma
model Contract {
  // ... existing fields ...

  // 🔑 JSON fields for flexible data storage
  formData Json? @db.Json  // Complete form payload
  terms    Json? @db.Json  // Contract clauses & schedules
  metadata Json? @db.Json  // Currency, tags, UI hints
  filesUrl String[]        // Document URLs
}
```

### UserKycProfile Model (Existing)

```prisma
model UserKycProfile {
  id               String  @id @default(uuid())
  userId           String  @unique
  buyerType        String? // "Resident" | "NonResident" | "Company"
  emiratesId       Json?   @db.Json
  passport         Json?   @db.Json
  workInfo         Json?   @db.Json
  contactInfo      Json?   @db.Json
  address          Json?   @db.Json
  emergencyContact Json?   @db.Json
  documents        Json?   @db.Json
}
```

---

## 📋 API Endpoints

### 1. Create Contract with Form Data

**POST** `/contracts/with-form-data`

Creates a contract with complete buyer information stored in JSON fields.

**Request Body:**
```typescript
{
  // Standard contract fields
  "propertyId": "uuid",
  "investorId": "uuid",
  "contractCode": "CN-2025-001",
  "contractValue": 500000,
  "depositPaid": 50000,

  // 🔑 Form data (JSON)
  "formData": {
    "leadSource": "Green List",
    "buyers": [{
      "buyerType": "Resident",
      "emiratesId": {
        "nameEn": "John Doe",
        "nameAr": "جون دو",
        "idNumber": "784-1995-1234567-1",
        "nationality": "Emirati",
        "gender": "Male",
        "dob": "1995-01-15T00:00:00.000Z",
        "expiryDate": "2025-12-31T00:00:00.000Z"
      },
      "passport": {
        "number": "A1234567",
        "nationality": "American",
        "issueDate": "2020-01-01T00:00:00.000Z",
        "expiryDate": "2030-12-31T00:00:00.000Z"
      },
      "contactInfo": {
        "preferredLanguage": "English",
        "domestic": {
          "email": "john@example.com",
          "mobile": "+971501234567"
        }
      },
      "workInfo": {
        "currentJob": "Software Engineer",
        "employer": "Tech Corp",
        "salary": 25000
      },
      "address": {
        "countryOfResidence": "UAE",
        "city": "Dubai",
        "street": "Sheikh Zayed Road"
      }
    }]
  },

  // Optional: Contract terms
  "terms": {
    "clauses": [],
    "schedules": [],
    "specialConditions": "Property must be vacant within 30 days"
  },

  // Optional: Metadata
  "metadata": {
    "currency": "AED",
    "tags": ["residential", "dubai"],
    "source": "web"
  },

  // Optional: File URLs
  "filesUrl": [
    "https://cdn.example.com/contract.pdf",
    "https://cdn.example.com/emirates-id.pdf"
  ]
}
```

**Response:**
```typescript
{
  "id": "uuid",
  "propertyId": "uuid",
  "investorId": "uuid",
  "contractCode": "CN-2025-001",
  "formData": { /* ... */ },
  "status": "pending",
  // ... other fields
}
```

---

### 2. Get KYC Autofill Data

**GET** `/contracts/kyc-autofill?userId=uuid`

Retrieves user's KYC profile data for autofilling contract forms.

**Query Parameters:**
- `userId` (optional, admin only): Get KYC data for specific user

**Response:**
```typescript
{
  "userId": "uuid",
  "kycProfileId": "uuid",
  "buyerType": "Resident",
  "emiratesId": {
    "nameEn": "John Doe",
    "idNumber": "784-1995-1234567-1",
    // ... other fields
  },
  "passport": { /* ... */ },
  "workInfo": { /* ... */ },
  "contactInfo": { /* ... */ },
  "address": { /* ... */ },
  "emergencyContact": { /* ... */ },
  "documents": {
    "emiratesIdCopy": "https://cdn.example.com/id.pdf"
  }
}
```

**Usage Example (Frontend):**
```typescript
// 1. Fetch KYC data when user opens contract form
const kycData = await fetch('/contracts/kyc-autofill');

// 2. Pre-fill form fields
form.setValue('formData.buyers[0].emiratesId', kycData.emiratesId);
form.setValue('formData.buyers[0].contactInfo', kycData.contactInfo);
// ... etc
```

---

### 3. Save Form Data to KYC Profile

**POST** `/contracts/save-kyc-from-form`

Saves contract form data back to user's KYC profile for future autofill.

**Request Body:**
```typescript
{
  "formData": {
    "buyers": [{
      "buyerType": "Resident",
      "emiratesId": { /* ... */ },
      "passport": { /* ... */ },
      // ... other fields
    }]
  }
}
```

**Response:**
```typescript
{
  "id": "uuid",
  "userId": "uuid",
  "buyerType": "Resident",
  "emiratesId": { /* ... */ },
  // ... other updated fields
}
```

**Usage Example (Frontend):**
```typescript
// When user clicks "Save for future contracts"
await fetch('/contracts/save-kyc-from-form', {
  method: 'POST',
  body: JSON.stringify({ formData: form.getValues() })
});
```

---

## 🔍 Zod Schemas

All form data is validated using Zod schemas defined in [contract.dto.ts](src/contracts/dto/contract.dto.ts).

### Available Schemas

1. **`EmiratesIdSchema`** - Emirates ID information
2. **`PassportSchema`** - Passport information
3. **`WorkInfoSchema`** - Employment details
4. **`ContactInfoSchema`** - Contact preferences
5. **`AddressSchema`** - Residential address
6. **`EmergencyContactSchema`** - Emergency contact info
7. **`BuyerSchema`** - Complete buyer information
8. **`ContractFormDataSchema`** - Full form data structure
9. **`ContractTermsSchema`** - Contract terms & clauses
10. **`ContractMetadataSchema`** - Additional metadata

### Type Exports

```typescript
import type {
  EmiratesId,
  Passport,
  WorkInfo,
  ContactInfo,
  Address,
  EmergencyContact,
  Buyer,
  ContractFormData,
  ContractTerms,
  ContractMetadata
} from './contracts/dto/contract.dto';
```

---

## 🔄 Workflow Examples

### Workflow 1: New User Creates First Contract

```
1. User opens contract creation form
2. Frontend calls GET /contracts/kyc-autofill
3. Backend returns null (no KYC profile yet)
4. User manually fills all form fields
5. User submits form
6. Frontend calls POST /contracts/with-form-data
7. Contract created with formData
8. (Optional) User clicks "Save for next time"
9. Frontend calls POST /contracts/save-kyc-from-form
10. KYC profile created → next contract will autofill!
```

### Workflow 2: Returning User Creates Contract

```
1. User opens contract creation form
2. Frontend calls GET /contracts/kyc-autofill
3. Backend returns saved KYC data
4. Frontend pre-fills all form fields ✨
5. User reviews/edits pre-filled data
6. User submits form
7. Frontend calls POST /contracts/with-form-data
8. Contract created instantly!
```

### Workflow 3: Multiple Buyers

```typescript
{
  "formData": {
    "leadSource": "Green List",
    "buyers": [
      {
        "userId": "buyer-1-uuid",
        "kycProfileId": "kyc-1-uuid",
        "role": "Primary",
        "buyerType": "Resident",
        // ... buyer 1 data
      },
      {
        "userId": "buyer-2-uuid",
        "role": "Co-buyer",
        "buyerType": "NonResident",
        // ... buyer 2 data
      }
    ]
  }
}
```

---

## 🎨 Frontend Integration Example

### React Hook Form + Zod

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { ContractFormDataSchema } from './schemas';

const form = useForm({
  resolver: zodResolver(ContractFormDataSchema),
  defaultValues: {
    leadSource: '',
    buyers: [{}]
  }
});

// Autofill on mount
useEffect(() => {
  async function loadKycData() {
    const kycData = await api.get('/contracts/kyc-autofill');
    if (kycData) {
      form.setValue('buyers.0.emiratesId', kycData.emiratesId);
      form.setValue('buyers.0.passport', kycData.passport);
      // ... etc
    }
  }
  loadKycData();
}, []);

// Submit
async function onSubmit(data) {
  await api.post('/contracts/with-form-data', {
    propertyId: selectedProperty.id,
    investorId: currentUser.id,
    contractCode: generateCode(),
    formData: data,
    // ... other fields
  });
}
```

---

## ✅ Benefits of JSON Approach

### 1. **Flexibility**
- Add new form fields without database migrations
- Support dynamic forms based on buyer type
- Easy A/B testing of form structures

### 2. **Performance**
- Single database query retrieves all contract data
- No complex JOIN queries needed
- Fast autofill with one API call

### 3. **Scalability**
- Easy to migrate to microservices later
- JSON structure can be moved to dedicated contract service
- API contracts stay the same

### 4. **Developer Experience**
- TypeScript types from Zod schemas
- Clear validation errors
- Easy to test and mock

---

## 🔒 Security Considerations

### 1. **Validation**
- All form data validated with Zod before storage
- Invalid data rejected with clear error messages
- Type safety prevents runtime errors

### 2. **Access Control**
- `GET /kyc-autofill` requires authentication
- Users can only access their own KYC data
- Admins can access any user's data with `?userId=` param

### 3. **Data Privacy**
- KYC data stored encrypted at rest (PostgreSQL default)
- Sensitive documents stored as URLs (actual files in S3/CDN)
- No passwords or payment details in JSON fields

---

## 🚀 Future Enhancements

### Phase 1 (Current) ✅
- [x] JSON-based form data storage
- [x] KYC autofill functionality
- [x] Zod schema validation
- [x] Basic CRUD operations

### Phase 2 (Planned)
- [ ] Contract versioning (using ContractVersion model)
- [ ] Digital signatures (using ContractSignature model)
- [ ] Change request workflow (using ContractChangeSet model)
- [ ] Audit trail (using ContractEvent model)

### Phase 3 (Future)
- [ ] Microservices migration
- [ ] Real-time collaboration
- [ ] PDF generation from formData
- [ ] E-signature integration (DocuSign, Adobe Sign)

---

## 🧪 Testing

### Manual Testing

#### Test 1: Create Contract with Form Data
```bash
curl -X POST http://localhost:3000/contracts/with-form-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "uuid",
    "investorId": "uuid",
    "contractCode": "CN-TEST-001",
    "formData": {
      "leadSource": "Green List",
      "buyers": [{
        "buyerType": "Resident",
        "emiratesId": {
          "nameEn": "Test User",
          "idNumber": "784-1995-1234567-1"
        }
      }]
    }
  }'
```

#### Test 2: Get KYC Autofill
```bash
curl -X GET http://localhost:3000/contracts/kyc-autofill \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test 3: Save to KYC Profile
```bash
curl -X POST http://localhost:3000/contracts/save-kyc-from-form \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "buyers": [{
        "emiratesId": { "nameEn": "Test User" }
      }]
    }
  }'
```

---

## 📚 Related Documentation

- [Prisma Schema](prisma/schema.prisma) - Lines 287-405 (Contract models)
- [Contract DTO](src/contracts/dto/contract.dto.ts) - Complete DTOs and Zod schemas
- [Contracts Service](src/contracts/services/contracts.service.ts) - Business logic
- [Contracts Controller](src/contracts/contracts.controller.ts) - API routes

---

## 🤝 Contributing

When adding new form fields:

1. Update Zod schema in `contract.dto.ts`
2. Add TypeScript type export
3. Update this documentation
4. Test validation with invalid data
5. Update frontend form component

---

## 📝 Notes

- All dates should be ISO 8601 strings: `"2025-12-31T00:00:00.000Z"`
- File URLs should be full HTTPS URLs (from CDN/S3)
- Buyer type enum: `"Resident" | "NonResident" | "Company"`
- Multiple buyers supported via `buyers` array
- Backward compatible with `buyer1` and `buyer2` fields

---

**Last Updated:** 2025-11-28
**Version:** 1.0.0
**Author:** AI Assistant
