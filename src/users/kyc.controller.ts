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
import { KycAutofillDataDto, ContractFormDataDto } from 'src/contracts/dto/contract-form.dto';
import { IsObject } from 'class-validator';

// DTO for save form data endpoint
class SaveFormDataDto {
  @IsObject()
  formData: ContractFormDataDto;
}

@UseGuards(JwtAuthGuard)
@ApiTags('users/kyc')
@Controller('users/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('autofill')
  @ApiOperation({
    summary: 'Get KYC data for contract form autofill',
    description: 'Retrieves user KYC profile data pre-mapped to the new contract form structure (contractDetails, buyerDetails, emiratesId, passportId, documents)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID to fetch KYC data for (admin only)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'KYC autofill data retrieved successfully.',
    type: KycAutofillDataDto,
    example: {
      userId: 'uuid-123',
      kycProfileId: 'uuid-456',
      contractDetails: {
        buyerType: 'Resident',
        preferredLanguage: 'English'
      },
      buyerDetails: {
        currentJob: 'Software Engineer',
        country: 'United Arab Emirates',
        city: 'Dubai',
        mobileDomestic: '+971501234567',
        emailDomestic: 'john@example.com'
      },
      emiratesId: {
        nameEn: 'John Doe',
        idNumber: '784-1995-1234567-1',
        nationality: 'Emirati'
      },
      passportId: {
        number: 'A1234567',
        nationality: 'American'
      },
      documents: {
        emiratesIdCopy: 'https://cdn.example.com/emirates-id.pdf',
        passportCopy: 'https://cdn.example.com/passport.pdf'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'KYC profile not found for this user.',
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
      throw new NotFoundException('KYC profile not found for this user');
    }

    return kycData;
  }

  @UseGuards(RolesGuard)
  @Roles('investor', 'admin', 'superadmin')
  @Post('save-from-form')
  @ApiOperation({
    summary: 'Save contract form data to KYC profile',
    description: 'Updates user KYC profile with data from contract form for future autofill. Expects the new ContractFormData structure.',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC profile updated successfully.',
    example: {
      id: 'uuid-123',
      userId: 'uuid-456',
      buyerType: 'Resident',
      emiratesId: { nameEn: 'John Doe', idNumber: '784-1995-1234567-1' },
      passport: { number: 'A1234567' },
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
