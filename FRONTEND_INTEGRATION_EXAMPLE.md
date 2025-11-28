# Frontend Integration Guide - Contract Form with KYC Autofill

## Quick Start Guide for Frontend Developers

This guide shows how to integrate the contract creation form with KYC autofill functionality.

---

## 🎯 Overview

The backend provides 3 main endpoints:

1. **GET** `/contracts/kyc-autofill` - Get saved KYC data to pre-fill the form
2. **POST** `/contracts/with-form-data` - Create contract with complete form data
3. **POST** `/contracts/save-kyc-from-form` - Save form data for future autofill

---

## 📦 TypeScript Types

Copy these types to your frontend project:

```typescript
// types/contract-form.ts

export type BuyerType = 'Resident' | 'NonResident' | 'Company';

export interface EmiratesId {
  nameEn?: string;
  nameAr?: string;
  isCitizenChild?: boolean;
  nationality?: string;
  idNumber?: string;
  dob?: string; // ISO date string
  expiryDate?: string; // ISO date string
  gender?: 'Male' | 'Female';
}

export interface Passport {
  number?: string;
  nationality?: string;
  issueDate?: string;
  expiryDate?: string;
  placeOfIssue?: string;
  type?: string;
  dob?: string;
}

export interface ContactInfo {
  preferredLanguage?: string;
  domestic?: {
    phone?: string;
    email?: string;
    mobile?: string;
  };
  abroad?: {
    phone?: string;
    email?: string;
    mobile?: string;
  };
}

export interface WorkInfo {
  currentJob?: string;
  employer?: string;
  position?: string;
  salary?: number;
  yearsOfExperience?: number;
}

export interface Address {
  countryOfResidence?: string;
  city?: string;
  street?: string;
  buildingName?: string;
  apartmentNo?: string;
  poBox?: string;
}

export interface EmergencyContact {
  nameEn?: string;
  nameAr?: string;
  relationType?: string; // "Spouse", "Parent", "Sibling"
  mobile?: string;
  email?: string;
  phone?: string;
}

export interface Buyer {
  userId?: string;
  kycProfileId?: string;
  buyerType?: BuyerType;
  role?: string; // "Primary", "Co-buyer", "Representative"
  emiratesId?: EmiratesId;
  passport?: Passport;
  workInfo?: WorkInfo;
  contactInfo?: ContactInfo;
  address?: Address;
  emergencyContact?: EmergencyContact;
  documents?: Record<string, string>; // label -> URL
  representativeCapacity?: string;
  powerOfAttorneyDetails?: string;
}

export interface ContractFormData {
  leadSource?: string; // "Green List", "First Time Home Buyer"
  buyers?: Buyer[];
  buyer1?: Buyer; // For backward compatibility
  buyer2?: Buyer; // For backward compatibility
  contractLanguage?: string;
  socialInfo?: {
    isDeterminedOnePeopleWithSpecialNeeds?: boolean;
  };
  metadata?: Record<string, any>;
}

export interface CreateContractRequest {
  // Required fields
  propertyId: string;
  investorId: string;
  contractCode: string;

  // Optional core fields
  brokerId?: string;
  contractLink?: string;
  signedDate?: string;
  contractStart?: string;
  contractEnd?: string;
  contractValue?: number;
  depositPaid?: number;
  investorPaymentMethod?: string;
  paymentSchedule?: string;
  vacancyRiskLevel?: string;
  status?: string;
  notes?: string;

  // JSON fields
  formData?: ContractFormData;
  terms?: any;
  metadata?: any;
  filesUrl?: string[];
}
```

---

## 🔧 React Example (TypeScript)

### 1. API Client Setup

```typescript
// api/contracts.ts

import axios from 'axios';
import type { CreateContractRequest, ContractFormData } from '@/types/contract-form';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const contractsApi = {
  // Get KYC autofill data
  getKycAutofill: async (userId?: string) => {
    const params = userId ? { userId } : {};
    const response = await api.get('/contracts/kyc-autofill', { params });
    return response.data;
  },

  // Create contract with form data
  createContract: async (data: CreateContractRequest) => {
    const response = await api.post('/contracts/with-form-data', data);
    return response.data;
  },

  // Save form data to KYC profile
  saveToKyc: async (formData: ContractFormData) => {
    const response = await api.post('/contracts/save-kyc-from-form', { formData });
    return response.data;
  },
};
```

---

### 2. React Hook Form Component

```typescript
// components/ContractForm.tsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { contractsApi } from '@/api/contracts';
import type { ContractFormData, Buyer } from '@/types/contract-form';

interface ContractFormProps {
  propertyId: string;
  investorId: string;
  onSuccess?: (contract: any) => void;
}

export function ContractForm({ propertyId, investorId, onSuccess }: ContractFormProps) {
  const [isLoadingKyc, setIsLoadingKyc] = useState(true);
  const [hasKycData, setHasKycData] = useState(false);

  const form = useForm<ContractFormData>({
    defaultValues: {
      leadSource: '',
      buyers: [{}],
      contractLanguage: 'English',
    },
  });

  // Load KYC data on mount
  useEffect(() => {
    async function loadKycData() {
      try {
        setIsLoadingKyc(true);
        const kycData = await contractsApi.getKycAutofill();

        if (kycData) {
          setHasKycData(true);

          // Pre-fill form with KYC data
          form.setValue('buyers.0', {
            userId: kycData.userId,
            kycProfileId: kycData.kycProfileId,
            buyerType: kycData.buyerType,
            emiratesId: kycData.emiratesId,
            passport: kycData.passport,
            workInfo: kycData.workInfo,
            contactInfo: kycData.contactInfo,
            address: kycData.address,
            emergencyContact: kycData.emergencyContact,
            documents: kycData.documents,
          });

          // Show success message
          console.log('✅ Form auto-filled with your saved data!');
        }
      } catch (error) {
        console.log('No saved KYC data found - starting fresh');
      } finally {
        setIsLoadingKyc(false);
      }
    }

    loadKycData();
  }, [form]);

  // Submit handler
  async function onSubmit(formData: ContractFormData) {
    try {
      const contract = await contractsApi.createContract({
        propertyId,
        investorId,
        contractCode: generateContractCode(), // Your code generation logic
        formData,
        filesUrl: [], // Add uploaded file URLs here
      });

      console.log('✅ Contract created:', contract);
      onSuccess?.(contract);
    } catch (error) {
      console.error('❌ Error creating contract:', error);
    }
  }

  // Save to KYC for future use
  async function saveForFutureUse() {
    try {
      const formData = form.getValues();
      await contractsApi.saveToKyc(formData);
      setHasKycData(true);
      alert('✅ Your information has been saved for future contracts!');
    } catch (error) {
      alert('❌ Failed to save information');
    }
  }

  if (isLoadingKyc) {
    return <div>Loading your saved information...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {hasKycData && (
        <div className="alert alert-success">
          ✨ Form pre-filled with your saved information!
        </div>
      )}

      {/* Lead Source */}
      <div>
        <label>Source of Lead</label>
        <select {...form.register('leadSource')}>
          <option value="">Please Select</option>
          <option value="Green List">Green List</option>
          <option value="First Time Home Buyer">First Time Home Buyer</option>
        </select>
      </div>

      {/* Buyer Type */}
      <div>
        <label>Buyer Type</label>
        <select {...form.register('buyers.0.buyerType')}>
          <option value="Resident">Resident</option>
          <option value="NonResident">Non-Resident</option>
          <option value="Company">Company</option>
        </select>
      </div>

      {/* Emirates ID Section */}
      <fieldset>
        <legend>Emirates ID Information</legend>

        <input
          type="text"
          placeholder="Name (English)"
          {...form.register('buyers.0.emiratesId.nameEn')}
        />

        <input
          type="text"
          placeholder="Name (Arabic)"
          {...form.register('buyers.0.emiratesId.nameAr')}
        />

        <input
          type="text"
          placeholder="ID Number"
          {...form.register('buyers.0.emiratesId.idNumber')}
        />

        <input
          type="date"
          placeholder="Date of Birth"
          {...form.register('buyers.0.emiratesId.dob')}
        />

        <input
          type="date"
          placeholder="Expiry Date"
          {...form.register('buyers.0.emiratesId.expiryDate')}
        />
      </fieldset>

      {/* Passport Section */}
      <fieldset>
        <legend>Passport Information</legend>

        <input
          type="text"
          placeholder="Passport Number"
          {...form.register('buyers.0.passport.number')}
        />

        <input
          type="text"
          placeholder="Nationality"
          {...form.register('buyers.0.passport.nationality')}
        />

        <input
          type="date"
          placeholder="Issue Date"
          {...form.register('buyers.0.passport.issueDate')}
        />
      </fieldset>

      {/* Contact Information */}
      <fieldset>
        <legend>Contact Information</legend>

        <input
          type="email"
          placeholder="Email"
          {...form.register('buyers.0.contactInfo.domestic.email')}
        />

        <input
          type="tel"
          placeholder="Mobile"
          {...form.register('buyers.0.contactInfo.domestic.mobile')}
        />
      </fieldset>

      {/* Buttons */}
      <div className="form-actions">
        <button type="submit">
          Create Contract
        </button>

        {!hasKycData && (
          <button type="button" onClick={saveForFutureUse}>
            💾 Save for Future Contracts
          </button>
        )}
      </div>
    </form>
  );
}

function generateContractCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CN-${year}-${random}`;
}
```

---

### 3. Simpler Example (Vanilla JavaScript)

```javascript
// Simple fetch-based implementation

async function loadContractForm() {
  const form = document.getElementById('contract-form');

  // 1. Try to load saved KYC data
  try {
    const response = await fetch('/api/contracts/kyc-autofill', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (response.ok) {
      const kycData = await response.json();

      // Pre-fill form fields
      document.getElementById('buyer-name-en').value = kycData.emiratesId?.nameEn || '';
      document.getElementById('buyer-id-number').value = kycData.emiratesId?.idNumber || '';
      document.getElementById('buyer-email').value = kycData.contactInfo?.domestic?.email || '';
      // ... fill other fields

      showMessage('✅ Form pre-filled with your saved data!');
    }
  } catch (error) {
    console.log('No saved data - starting fresh');
  }

  // 2. Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      propertyId: document.getElementById('property-id').value,
      investorId: getCurrentUserId(),
      contractCode: generateContractCode(),
      formData: {
        leadSource: document.getElementById('lead-source').value,
        buyers: [{
          buyerType: document.getElementById('buyer-type').value,
          emiratesId: {
            nameEn: document.getElementById('buyer-name-en').value,
            idNumber: document.getElementById('buyer-id-number').value,
            // ... other fields
          },
          contactInfo: {
            domestic: {
              email: document.getElementById('buyer-email').value,
              mobile: document.getElementById('buyer-mobile').value,
            },
          },
        }],
      },
    };

    try {
      const response = await fetch('/api/contracts/with-form-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const contract = await response.json();
        alert('✅ Contract created successfully!');
        window.location.href = `/contracts/${contract.id}`;
      }
    } catch (error) {
      alert('❌ Failed to create contract');
    }
  });
}

// 3. Save to KYC button
document.getElementById('save-to-kyc-btn').addEventListener('click', async () => {
  const formData = {
    buyers: [{
      emiratesId: {
        nameEn: document.getElementById('buyer-name-en').value,
        // ... gather all form values
      },
    }],
  };

  const response = await fetch('/api/contracts/save-kyc-from-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({ formData }),
  });

  if (response.ok) {
    alert('✅ Information saved for future contracts!');
  }
});
```

---

## 🎯 Key Points for Frontend

### 1. **Date Handling**
Always use ISO 8601 format:
```typescript
const date = new Date('1995-01-15');
const isoString = date.toISOString(); // "1995-01-15T00:00:00.000Z"
```

### 2. **Error Handling**
```typescript
try {
  await contractsApi.createContract(data);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    const message = error.response.data.message;
    showValidationError(message);
  } else if (error.response?.status === 404) {
    // Property not found
    alert('Property not found');
  } else {
    // Generic error
    alert('Failed to create contract');
  }
}
```

### 3. **File Uploads**
Upload files first, then include URLs in formData:
```typescript
// 1. Upload files to S3/CDN
const uploadedUrls = await uploadFiles(files);

// 2. Include URLs in contract
await contractsApi.createContract({
  // ... other fields
  filesUrl: uploadedUrls,
  formData: {
    buyers: [{
      documents: {
        'emiratesIdCopy': uploadedUrls[0],
        'passportCopy': uploadedUrls[1],
      }
    }]
  }
});
```

### 4. **Multiple Buyers**
```typescript
const formData = {
  buyers: [
    {
      role: 'Primary',
      emiratesId: { nameEn: 'Buyer 1' },
    },
    {
      role: 'Co-buyer',
      emiratesId: { nameEn: 'Buyer 2' },
    },
  ],
};
```

---

## 🧪 Testing Tips

### Test 1: No KYC Data (New User)
```
1. Clear localStorage
2. Open contract form
3. Should show empty form
4. Fill manually
5. Click "Save for future"
6. Reload page
7. Form should auto-fill ✅
```

### Test 2: Existing KYC Data
```
1. User with saved KYC data logs in
2. Open contract form
3. Form pre-fills automatically ✅
4. Edit some fields
5. Submit
6. Contract created with edited data ✅
```

### Test 3: Admin Creating Contract for User
```
1. Admin logs in
2. Opens contract form
3. Selects investor from dropdown
4. Call: GET /contracts/kyc-autofill?userId=INVESTOR_ID
5. Form pre-fills with investor's KYC data ✅
```

---

## 📱 Mobile Considerations

For React Native or mobile apps:

```typescript
// Use same API endpoints, just different HTTP client
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.yourapp.com',
});

// Add token from secure storage
import * as SecureStore from 'expo-secure-store';

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Use same functions as web
const kycData = await api.get('/contracts/kyc-autofill');
```

---

## 🆘 Common Issues

### Issue 1: Form not auto-filling
**Solution:** Check browser console for 404 error. User might not have KYC profile yet.

### Issue 2: Validation errors
**Solution:** Check that dates are ISO strings, not Date objects:
```typescript
// ❌ Wrong
formData.emiratesId.dob = new Date();

// ✅ Correct
formData.emiratesId.dob = new Date().toISOString();
```

### Issue 3: Token expired
**Solution:** Refresh token before API calls:
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshAuthToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 📞 Support

For backend issues, check:
- [CONTRACT_FORM_DATA_IMPLEMENTATION.md](CONTRACT_FORM_DATA_IMPLEMENTATION.md)
- API Documentation: http://localhost:3000/api (Swagger)
- Backend logs

For frontend issues:
- Check browser console
- Verify API responses in Network tab
- Test with Postman/curl first

---

**Happy Coding! 🚀**
