import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { ContractsService } from './services/contracts.service';
import {
  ContractDto,
  ContractWithInvestor,
  ContractWithProperties,
  ContractWithRelations,
  UpdateContractDto,
  CreateContractWithFormDataDto,
  KycAutofillDataDto,
} from './dto/contract.dto';
import { ContractIdParamDto } from 'src/properties/dto/property.create.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new contract',
    description: 'Create a contract with optional form data (buyer info, documents, etc.)'
  })
  @ApiResponse({
    status: 201,
    description: 'Contract created successfully.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  @ApiResponse({ status: 400, description: 'Invalid form data.' })
  async createContract(
    @CurrentUser() user: CurrentUser,
    @Body() dto: CreateContractWithFormDataDto,
  ) {
    return this.contractsService.createContract(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investor')
  @Get()
  @ApiOperation({ summary: 'Get all contracts [InvestorOnly]' })
  @ApiResponse({
    status: 200,
    description: 'List of all contracts retrieved successfully.',
    type: [ContractWithProperties],
  })
  async getAll(@CurrentUser() user: CurrentUser) {
    return this.contractsService.getAll(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('/all')
  @ApiOperation({ summary: 'Get all contracts [AdminOnly]' })
  @ApiResponse({
    status: 200,
    description: 'List of all contracts retrieved successfully.',
    type: [ContractWithInvestor],
  })
  async findAll() {
    return this.contractsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'investor')
  @Get(':id')
  @ApiOperation({ summary: 'Get a contract by ID [AdminOnly]' })
  @ApiResponse({
    status: 200,
    description: 'Contract retrieved successfully.',
    type: ContractWithRelations,
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  async findOne(@Param() { id }: ContractIdParamDto) {
    console.log('Finding contract with id:', id);
    return this.contractsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'investor')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing contract [AdminOnly]' })
  @ApiResponse({
    status: 200,
    description: 'Contract updated successfully.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  async update(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: ContractIdParamDto,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(user, id, dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contract [AdminOnly]' })
  @ApiResponse({
    status: 200,
    description: 'Contract deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  async remove(@Param() { id }: ContractIdParamDto) {
    return this.contractsService.remove(id);
  }

  // ============================================================================
  // KYC AUTOFILL ROUTES
  // ============================================================================

  @Get('kyc-autofill')
  @ApiOperation({
    summary: 'Get KYC data for contract form autofill',
    description: 'Retrieves user KYC profile data to pre-populate contract creation forms'
  })
  @ApiResponse({
    status: 200,
    description: 'KYC autofill data retrieved successfully.',
    type: KycAutofillDataDto,
  })
  @ApiResponse({
    status: 404,
    description: 'KYC profile not found for this user.'
  })
  async getKycAutofillData(
    @CurrentUser() user: CurrentUser,
    @Query('userId') userId?: string,
  ) {
    // Allow admins to get KYC data for other users
    const targetUserId = (userId && (user.role === 'admin' || user.role === 'superadmin'))
      ? userId
      : user.userId;

    const kycData = await this.contractsService.getKycAutofillData(targetUserId);

    if (!kycData) {
      throw new NotFoundException('KYC profile not found for this user');
    }

    return kycData;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investor', 'admin', 'superadmin')
  @Post('save-kyc-from-form')
  @ApiOperation({
    summary: 'Save contract form data to KYC profile',
    description: 'Updates user KYC profile with data from contract form for future autofill'
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
    return this.contractsService.saveFormDataToKyc(user.userId, body.formData);
  }
}
