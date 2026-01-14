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
      contractCode: 'CN-2025-001',
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
  @Roles('admin', 'superadmin', 'investor')
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update an existing contract',
    description: `Update contract details including:f
    - Basic contract information (dates, values, payment details)
    - Contract status
    - Form data (Buyer Details, Emirates ID, Passport, Documents, etc.)
    - File URLs
    All fields are optional - only provide the fields you want to update.`
  })
  @ApiResponse({
    status: 200,
    description: 'Contract updated successfully.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @ApiResponse({ status: 400, description: 'Invalid form data.' })
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
  async remove(
    @CurrentUser() user: CurrentUser,
    @Param() { id }: ContractIdParamDto,
  ) {
    return this.contractsService.remove(user, id);
  }
}
