import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { KycService } from './services/kyc.service';
import { KycAutofillDataDto, ContractFormDataDto, ContractFormData } from 'src/contracts/dto/contract-form.dto';
import { IsObject } from 'class-validator';

// DTO for save form data endpoint
class SaveFormDataDto {
  @IsObject()
  formData: ContractFormData;
}

@UseGuards(JwtAuthGuard)
@ApiTags('users/kyc')
@Controller('users/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('autofill')
  @ApiOperation({
    summary: 'Get KYC data for contract form autofill',
    description: `Retrieves user data pre-mapped to contract form structure. Returns complete form data with:
    - User profile data (name, email, phone, nationality, residence) as fallback
    - Stored KYC identity documents (Emirates ID, Passport)
    - Stored buyer details (job, address, emergency contacts) - reusable across contracts
    - Verification document URLs
    - Default values for contract-specific fields (buyerType, lead source, etc.)
    
    Buyer details are saved and reused across contracts to avoid re-entering the same information.`,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID to fetch KYC data for (admin only)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'KYC autofill data retrieved successfully. All fields are populated with either stored KYC data, user profile data, or default values.',
    type: KycAutofillDataDto,
    example: {
      userId: '17bcfe16-fca7-4059-a4a0-144dea44934a',
      kycProfileId: 'ee3611c8-6d6f-488b-a845-80cefbfd9599',
      contractDetails: {
        isLeadGreenList: false,
        buyerType: 'Resident',
        representationType: 'Self',
        preferredLanguage: 'English'
      },
      buyerDetails: {
        isSpecialNeeds: false,
        currentJob: '',
        country: 'United Arab Emirates',
        city: '',
        emailDomestic: 'john.doe@example.com',
        mobileDomestic: '+971501234567',
        extCodeDomestic: ''
      },
      emiratesId: {
        nameEn: 'John Doe',
        nameAr: 'جون دو',
        isCitizenChild: false,
        nationality: 'Emirati',
        gender: 'Male',
        idNumber: '784-1995-1234567-1',
        expiryDate: '2030-12-31',
        unifiedNumber: '123456789',
        fileNumber: 'FILE-2025-001',
        dateOfBirth: '1995-01-15',
        placeOfBirth: 'Dubai'
      },
      passportId: {
        number: 'A1234567',
        passportType: 'Ordinary',
        nationality: 'American',
        issuePlace: 'New York',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01',
        dateOfBirth: '1995-01-15',
        placeOfBirth: 'New York'
      },
      documents: {
        emiratesIdCopy: { name: 'emirates_id.pdf', url: 'https://cdn.example.com/emirates-id.pdf', sizeMb: 1.5, mimeType: 'application/pdf' },
        passportCopy: { name: 'passport.pdf', url: 'https://cdn.example.com/passport.pdf', sizeMb: 2.1, mimeType: 'application/pdf' },
        visaCopy: { name: 'visa.pdf', url: 'https://cdn.example.com/visa.pdf', sizeMb: 1.2, mimeType: 'application/pdf' },
        utilityBill: null,
        bankStatement: null,
        personalPhoto: { name: 'photo.jpg', url: 'https://cdn.example.com/profile.jpg', sizeMb: 0.5, mimeType: 'image/jpeg' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  async getKycAutofillData(
    @CurrentUser() user: CurrentUser,
    @Query('userId') userId?: string,
  ) {
    // Allow admins to get KYC data for other users
    const targetUserId =
      userId && (user.role === 'admin' || user.role === 'superadmin')
        ? userId
        : user.userId;

    const kycData = await this.kycService.getKycAutofillData(targetUserId);

    if (!kycData) {
      throw new NotFoundException('User not found');
    }

    return kycData;
  }

  @UseGuards(RolesGuard)
  @Roles('investor', 'admin', 'superadmin')
  @Post('save-from-form')
  @ApiOperation({
    summary: 'Save contract form data to KYC profile',
    description: `Updates user KYC profile with data from contract form for future autofill. Saves:
    - Identity documents (Emirates ID, Passport)
    - Verification documents (Emirates ID copy, passport copy, visa, etc.)
    - Buyer details (job, address, emergency contacts) - reusable across contracts
    
    Contract-specific fields (buyerType, lead source) are NOT saved as they vary per contract.`,
  })
  @ApiResponse({
    status: 200,
    description: 'KYC profile updated successfully.',
    example: {
      id: 'uuid-123',
      userId: 'uuid-456',
      emiratesId: { nameEn: 'John Doe', idNumber: '784-1995-1234567-1' },
      passport: { number: 'A1234567' },
      buyerDetails: { currentJob: 'Software Engineer', country: 'United Arab Emirates', city: 'Dubai' },
      documents: { emiratesIdCopy: 'https://cdn.example.com/id.pdf' },
      createdAt: '2025-12-27T00:00:00.000Z',
      updatedAt: '2025-12-27T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid form data.' })
  async saveFormDataToKyc(
    @CurrentUser() user: CurrentUser,
    @Body() body: SaveFormDataDto,
  ) {
    return this.kycService.saveFormDataToKyc(user.userId, body.formData);
  }
}
