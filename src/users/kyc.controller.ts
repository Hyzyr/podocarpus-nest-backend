import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { KycService } from './services/kyc.service';
import { KycAutofillDataDto } from 'src/contracts/dto/contract.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('users/kyc')
@Controller('users/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('autofill')
  @ApiOperation({
    summary: 'Get KYC data for contract form autofill',
    description: 'Retrieves user KYC profile data to pre-populate contract creation forms',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC autofill data retrieved successfully.',
    type: KycAutofillDataDto,
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
    description:
      'Updates user KYC profile with data from contract form for future autofill',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC profile updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid form data.' })
  async saveFormDataToKyc(
    @CurrentUser() user: CurrentUser,
    @Body() body: { formData: any },
  ) {
    return this.kycService.saveFormDataToKyc(user.userId, body.formData);
  }
}
