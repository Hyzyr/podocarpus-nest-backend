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
import { JwtAuthGuard } from 'src/_helpers/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { ContractsService } from './contracts.service';
import {
  ContractDto,
  ContractWithInvestor,
  ContractWithProperties,
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';
import { ContractIdParamDto } from 'src/properties/dto/property.create.dto';
import { CurrentUser } from 'src/_helpers/user.decorator';

@UseGuards(JwtAuthGuard)
@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contract for a property [AdminOnly]' })
  @ApiResponse({
    status: 201,
    description: 'Contract created successfully.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  async createContract(@Body() dto: CreateContractDto) {
    return this.contractsService.createContract(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('investor')
  @Get()
  @ApiOperation({ summary: 'Get all contracts [AdminOnly]' })
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
  @Roles('admin', 'superadmin')
  @Get(':id')
  @ApiOperation({ summary: 'Get a contract by ID [AdminOnly]' })
  @ApiResponse({
    status: 200,
    description: 'Contract retrieved successfully.',
    type: ContractDto,
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  async findOne(@Param() { id }: ContractIdParamDto) {
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
    @Param() { id }: ContractIdParamDto,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(id, dto);
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
}
