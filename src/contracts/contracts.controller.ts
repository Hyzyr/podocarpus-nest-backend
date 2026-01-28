import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
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
  StoreDraftDto,
  UpdateDraftDto,
  PublishContractDto,
  AdminUpdateContractDto,
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
    description: `Create a contract with the new clean formData structure:
    - contractDetails: isLeadGreenList, buyerType, representationType, preferredLanguage
    - buyerDetails: contact info, address, employment, emergency contact (all flat fields)
    - emiratesId: full Emirates ID information
    - passportId: full passport information
    - documents: specific document URLs (emiratesIdCopy, passportCopy, visaCopy, etc.)`
  })
  @ApiResponse({
    status: 201,
    description: 'Contract created successfully.',
    type: ContractDto,
    example: {
      id: 'uuid-123',
      propertyId: 'uuid-456',
      investorId: 'uuid-789',
      status: 'pending',
      formData: {
        contractDetails: {
          isLeadGreenList: true,
          buyerType: 'Resident',
          representationType: 'Self',
          preferredLanguage: 'English'
        },
        buyerDetails: {
          currentJob: 'Software Engineer',
          city: 'Dubai',
          mobileDomestic: '+971501234567'
        },
        emiratesId: {
          nameEn: 'John Doe',
          idNumber: '784-1995-1234567-1'
        }
      }
    }
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
    return this.contractsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update contract (Admin only - administrative fields)',
    description: `Admin/Agent can update ONLY administrative fields:
    - status (pending → active, rejected, suspended)
    - brokerId (assign broker)
    - notes (internal notes)
    - contractStart/contractEnd (dates after approval)
    - contractValue/depositPaid (confirm financial values)
    - paymentSchedule/investorPaymentMethod/vacancyRiskLevel
    - signedDate/fileUrl (after signing)
    
    ⚠️ Admins CANNOT modify:
    - formData (legal investor data: buyerDetails, emiratesId, passportId, documents)
    - Only the investor can edit formData via draft endpoints`
  })
  @ApiResponse({
    status: 200,
    description: 'Contract updated successfully.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot modify legal data.' })
  async adminUpdate(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: ContractIdParamDto,
    @Body() dto: AdminUpdateContractDto,
  ) {
    return this.contractsService.adminUpdate(user, id, dto);
  }

  // ============================================================================
  // Draft Management Endpoints
  // ============================================================================

  @Post('draft')
  @ApiOperation({
    summary: 'Create a new contract draft',
    description: `Create a contract draft with minimal validation. Investors can save incomplete contracts and continue later.
    - No strict validation on formData
    - Status is automatically set to 'draft'
    - Can be updated later with updateDraft endpoint`
  })
  @ApiResponse({
    status: 201,
    description: 'Draft created successfully.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Property or investor not found.' })
  async storeDraft(
    @CurrentUser() user: CurrentUser,
    @Body() dto: StoreDraftDto,
  ) {
    return this.contractsService.storeDraft(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'investor')
  @Patch('draft/:id')
  @ApiOperation({
    summary: 'Update a draft contract',
    description: `Update an existing draft contract. Only works for contracts with status 'draft'.
    - Investors can only update their own drafts
    - Admins can update any draft
    - FormData is merged with existing data
    - No strict validation required`
  })
  @ApiResponse({
    status: 200,
    description: 'Draft updated successfully.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @ApiResponse({ status: 400, description: 'Contract is not a draft.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your draft.' })
  async updateDraft(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: ContractIdParamDto,
    @Body() dto: UpdateDraftDto,
  ) {
    return this.contractsService.updateDraft(user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'investor')
  @Post('publish/:id')
  @ApiOperation({
    summary: 'Publish a draft contract',
    description: `Publish a draft contract (change status from 'draft' to 'pending').
    - Requires full validation of formData
    - Investors can publish their own drafts
    - Admins can publish any draft
    - Optional: merge additional data before publishing
    - Admin will review and approve/reject the pending contract`
  })
  @ApiResponse({
    status: 200,
    description: 'Contract published successfully. Status changed to pending.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @ApiResponse({ status: 400, description: 'Contract is already published or validation failed.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your draft.' })
  async publishContract(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: ContractIdParamDto,
    @Body() dto?: PublishContractDto,
  ) {
    return this.contractsService.publishContract(user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'investor')
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete a contract',
    description: 'Admins can delete any contract. Investors can only delete their own contracts if the status is draft or pending.'
  })
  @ApiResponse({
    status: 200,
    description: 'Contract deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden - check ownership or contract status.' })
  async remove(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: ContractIdParamDto,
  ) {
    return this.contractsService.remove(user, id);
  }
}
