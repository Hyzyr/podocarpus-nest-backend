# Swagger API Documentation Guide

## Overview

Your API has full Swagger/OpenAPI documentation available for frontend developers and client applications.

---

## 1. Accessing Swagger Documentation

### **Swagger UI (Interactive Docs)**
```
http://localhost:8000/swagger
```

- 🌐 **Interactive UI** - Test endpoints directly in the browser
- 🔐 **Authentication** - Built-in Bearer token support
- 📝 **Request/Response Examples** - See all DTOs and schemas
- ✅ **Try it out** - Execute API calls directly from the UI

### **JSON Schema Export (for Code Generation)**
```
http://localhost:8000/swagger-json
```

- 📄 **OpenAPI 3.0 JSON** - Machine-readable API specification
- 🔧 **Client Generation** - Use with `openapi-generator`, `swagger-codegen`, or similar tools
- 🎯 **TypeScript Types** - Generate types for frontend apps

---

## 2. Contract Endpoints Documentation

All contract endpoints are properly documented with:

### **POST /contracts** - Create Contract
- ✅ **Supports both flat and nested buyer format**
- ✅ **Examples shown in Swagger** for both formats
- ✅ **Full validation** with error messages

**Swagger shows two examples:**
1. **Flat format** (from UI form)
2. **Nested format** (database storage)

### **GET /contracts** - Get All Contracts (Investor)
- Returns contracts with property details
- Investor-only access

### **GET /contracts/all** - Get All Contracts (Admin)
- Returns all contracts with investor details
- Admin/Superadmin only

### **GET /contracts/:id** - Get Contract by ID
- Returns contract with full relations (property + investor)

### **PATCH /contracts/:id** - Update Contract
- Partial update support

### **DELETE /contracts/:id** - Delete Contract
- Admin/Superadmin only

### **GET /contracts/kyc-autofill** - Get KYC Autofill Data
- Returns user's KYC data in **flat format** for easy form binding
- Admins can fetch for other users with `?userId=xxx`

### **POST /contracts/save-kyc-from-form** - Save Form to KYC
- Saves contract form data to user's KYC profile
- Auto-converts flat → nested format

---

## 3. Using Swagger JSON for Client Code Generation

### **Step 1: Download the Schema**
```bash
curl http://localhost:8000/swagger-json > openapi.json
```

### **Step 2: Generate Client Code**

#### **TypeScript/JavaScript (using openapi-typescript)**
```bash
npm install -D openapi-typescript
npx openapi-typescript http://localhost:8000/swagger-json -o ./src/types/api.d.ts
```

Then use in your frontend:
```typescript
import type { paths } from './types/api';

// Fully typed API client
type CreateContractRequest = paths['/contracts']['post']['requestBody']['content']['application/json'];
type ContractResponse = paths['/contracts']['post']['responses']['201']['content']['application/json'];
```

#### **React/Vue (using openapi-generator)**
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:8000/swagger-json \
  -g typescript-fetch \
  -o ./src/api-client
```

#### **React Query Hooks (using orval)**
```bash
npm install -D orval
npx orval --input http://localhost:8000/swagger-json --output ./src/api
```

Generates:
```typescript
// Auto-generated hooks
import { useCreateContract, useGetContracts } from './api/contracts';

function ContractForm() {
  const { mutate: createContract } = useCreateContract();

  const handleSubmit = (data) => {
    createContract({
      data: {
        propertyId: 'uuid',
        investorId: 'uuid',
        contractCode: 'CN-2025-001',
        formData: {
          buyer: data // Flat format works!
        }
      }
    });
  };
}
```

---

## 4. DTOs Available in Swagger

All these DTOs are documented with examples:

### **Contract DTOs**
- `ContractDto` - Basic contract data
- `CreateContractWithFormDataDto` - Create contract with form data (flat/nested buyer)
- `UpdateContractDto` - Update contract (partial)
- `ContractWithProperties` - Contract + property details
- `ContractWithInvestor` - Contract + investor details
- `ContractWithRelations` - Contract + property + investor

### **Buyer DTOs**
- `BuyerFormDto` - **Flat format** (recommended for UI)
- `Buyer` - **Nested format** (stored in DB)
- Both formats are accepted by the API!

### **KYC DTOs**
- `KycAutofillDataDto` - KYC data for form autofill (flat format)

### **Nested Types**
- `EmiratesId` - Emirates ID details
- `Passport` - Passport details
- `WorkInfo` - Employment information
- `ContactInfo` - Contact details (supports both flat and nested)
- `Address` - Address information
- `EmergencyContact` - Emergency contact

---

## 5. Authentication in Swagger UI

### **Step 1: Login**
Use the `/auth/login` endpoint to get a JWT token

### **Step 2: Authorize**
1. Click the **🔓 Authorize** button at the top
2. Enter: `Bearer <your-jwt-token>`
3. Click **Authorize**

Now all protected endpoints will include the token automatically!

---

## 6. Example Requests in Swagger

### **Create Contract with Flat Buyer (Recommended for UI)**

Swagger shows this example:
```json
{
  "propertyId": "uuid",
  "investorId": "uuid",
  "contractCode": "CN-2025-001",
  "formData": {
    "leadSource": "Green List",
    "buyer": {
      "buyerType": "Resident",
      "fullNameEn": "John Doe",
      "emiratesId": "784-1995-1234567-1",
      "nationality": "Emirati",
      "mobile": "+971501234567",
      "email": "john@example.com",
      "city": "Dubai",
      "street": "Sheikh Zayed Road"
    }
  }
}
```

### **Create Contract with Nested Buyer (Database Format)**

Swagger also shows:
```json
{
  "propertyId": "uuid",
  "investorId": "uuid",
  "contractCode": "CN-2025-001",
  "formData": {
    "leadSource": "Green List",
    "buyer": {
      "buyerType": "Resident",
      "emiratesId": {
        "nameEn": "John Doe",
        "idNumber": "784-1995-1234567-1",
        "nationality": "Emirati"
      },
      "contactInfo": {
        "mobile": "+971501234567",
        "email": "john@example.com"
      }
    }
  }
}
```

Both work! The API auto-converts flat → nested.

---

## 7. Downloading Contract Schema Types

### **For TypeScript Projects:**

**Option 1: Generate types from swagger-json**
```bash
npx openapi-typescript http://localhost:8000/swagger-json -o ./src/types/api.d.ts
```

**Option 2: Copy DTOs directly**
The DTOs in `src/contracts/dto/contract.dto.ts` can be copied to your frontend:
```typescript
// Copy these types to your frontend
export type BuyerForm = {
  buyerType?: 'Resident' | 'NonResident' | 'Company';
  fullNameEn?: string;
  fullNameAr?: string;
  nationality?: string;
  emiratesId?: string;
  mobile?: string;
  email?: string;
  city?: string;
  street?: string;
  // ... all fields
};
```

---

## 8. Response Examples

All responses are documented in Swagger with proper types:

**GET /contracts/:id** returns:
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "investorId": "uuid",
  "contractCode": "CN-2025-001",
  "status": "pending",
  "formData": {
    "buyer": { /* nested format */ }
  },
  "property": { /* property details */ },
  "investor": {
    "user": { /* user details */ }
  },
  "createdAt": "2025-11-28T...",
  "updatedAt": "2025-11-28T..."
}
```

---

## 9. Testing in Swagger UI

### **Test Create Contract:**
1. Go to `http://localhost:8000/swagger`
2. Find **POST /contracts**
3. Click **Try it out**
4. Use the example request (flat or nested)
5. Click **Execute**
6. See the response!

### **Test KYC Autofill:**
1. Find **GET /contracts/kyc-autofill**
2. Click **Try it out**
3. Click **Execute**
4. Response shows flat format ready for your form!

---

## 10. Frontend Integration Checklist

- [ ] Download OpenAPI schema: `http://localhost:8000/swagger-json`
- [ ] Generate TypeScript types for your frontend
- [ ] Use `BuyerFormDto` type for your contract forms
- [ ] Fetch KYC autofill data from `/contracts/kyc-autofill`
- [ ] Send flat buyer format to `POST /contracts`
- [ ] Backend auto-converts flat → nested ✅

---

## 11. Useful Commands

### **View Swagger UI**
```bash
# Open in browser
open http://localhost:8000/swagger
```

### **Download JSON Schema**
```bash
curl http://localhost:8000/swagger-json > openapi.json
```

### **Generate TypeScript Client**
```bash
npm install -D openapi-typescript-codegen
npx openapi-typescript-codegen --input http://localhost:8000/swagger-json --output ./src/api
```

### **Validate Schema**
```bash
npx @apidevtools/swagger-cli validate http://localhost:8000/swagger-json
```

---

## Summary

✅ **Swagger UI available** at `/swagger`
✅ **JSON schema export** at `/swagger-json`
✅ **All DTOs documented** with examples
✅ **Flat and nested buyer formats** both shown
✅ **Authentication support** with Bearer tokens
✅ **Ready for code generation** (TypeScript, React, Vue, etc.)
✅ **KYC autofill endpoint** for easy form prefilling

Your API is fully documented and ready for frontend integration! 🎉
