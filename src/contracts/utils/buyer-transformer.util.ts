import { Buyer, BuyerForm } from '../dto/contract.dto';

/**
 * Transforms flat buyer form data to nested structure for database storage
 * @param flat - Flat buyer form from UI
 * @returns Nested buyer structure for Contract.formData
 */
export function flatToNestedBuyer(flat: BuyerForm): Buyer {
  return {
    buyerType: flat.buyerType,
    emiratesId: {
      nameEn: flat.fullNameEn,
      nameAr: flat.fullNameAr,
      nationality: flat.nationality,
      isCitizenChild: flat.isCitizenChild,
      idNumber: flat.emiratesId,
      expiryDate: flat.emiratesIdExpiry,
      dob: flat.dateOfBirth,
      gender: flat.gender,
    },
    passport: {
      number: flat.passportNumber,
      issueDate: flat.passportIssueDate,
      expiryDate: flat.passportExpiryDate,
      nationality: flat.passportNationality,
      dob: flat.dateOfBirth,
    },
    workInfo: {
      currentJob: flat.currentJob,
    },
    contactInfo: {
      mobile: flat.mobile,
      phone: flat.phone,
      email: flat.email,
      // Keep preferredLanguage if it exists in the form
      preferredLanguage: (flat as any).preferredLanguage,
    },
    address: {
      countryOfResidence: flat.country,
      city: flat.city,
      cityArabic: flat.cityArabic,
      street: flat.street,
      buildingName: flat.buildingName,
      apartmentNo: flat.apartmentNo,
      zipCode: flat.zipCode,
      poBox: flat.poBox,
    },
    emergencyContact: flat.emergencyContact,
  };
}

/**
 * Transforms nested buyer structure to flat form for UI
 * @param nested - Nested buyer from Contract.formData
 * @returns Flat buyer form for UI
 */
export function nestedToFlatBuyer(nested: Buyer): BuyerForm {
  return {
    // Basic Info
    buyerType: nested.buyerType,
    fullNameEn: nested.emiratesId?.nameEn,
    fullNameAr: nested.emiratesId?.nameAr,
    nationality: nested.emiratesId?.nationality || nested.passport?.nationality,
    isCitizenChild: nested.emiratesId?.isCitizenChild,
    gender: nested.emiratesId?.gender,

    // Identification
    emiratesId: nested.emiratesId?.idNumber,
    emiratesIdExpiry: nested.emiratesId?.expiryDate,
    passportNumber: nested.passport?.number,
    passportIssueDate: nested.passport?.issueDate,
    passportExpiryDate: nested.passport?.expiryDate,
    passportNationality: nested.passport?.nationality,
    dateOfBirth: nested.emiratesId?.dob || nested.passport?.dob,

    // Contact Information
    mobile: nested.contactInfo?.mobile,
    phone: nested.contactInfo?.phone,
    email: nested.contactInfo?.email,
    country: nested.address?.countryOfResidence,
    city: nested.address?.city,

    // Employment
    currentJob: nested.workInfo?.currentJob,

    // Address
    street: nested.address?.street,
    cityArabic: nested.address?.cityArabic,
    buildingName: nested.address?.buildingName,
    apartmentNo: nested.address?.apartmentNo,
    zipCode: nested.address?.zipCode,
    poBox: nested.address?.poBox,

    // Emergency Contact
    emergencyContact: nested.emergencyContact,
  };
}

/**
 * Helper to check if buyer data is in flat format
 */
export function isFlatBuyerFormat(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    ('fullNameEn' in data || 'mobile' in data || 'emiratesId' in data)
  );
}

/**
 * Auto-detects format and converts to nested if needed
 */
export function ensureNestedBuyer(data: any): Buyer {
  if (!data) return {} as Buyer;
  if (isFlatBuyerFormat(data)) {
    return flatToNestedBuyer(data as BuyerForm);
  }
  return data as Buyer;
}
