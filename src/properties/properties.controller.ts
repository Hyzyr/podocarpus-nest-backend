import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './services/properties.service';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import {
  AdminPropertyDto,
  AdminPropertyWithContractsDto,
  AdminPropertyWithRelationsDto,
  PublicPropertyDto,
  PublicPropertyWithRelations,
} from './dto/property.get.dto';
import {
  FindAllPropertiesQueryDto,
  PropertyIdParamDto,
} from './dto/property.query.dto';
import { CreatePropertyDto } from './dto/property.create.dto';
import { UpdatePropertyDto } from './dto/property.update.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get a list of properties' })
  @ApiResponse({
    status: 200,
    description: 'List of properties retrieved successfully.',
    type: [PublicPropertyDto],
  })
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get('/search')
  @ApiOperation({ summary: 'Get a list of properties' })
  @ApiResponse({
    status: 200,
    description: 'List of properties retrieved successfully.',
    type: [PublicPropertyDto],
  })
  searchAll(@Query() query?: FindAllPropertiesQueryDto) {
    return this.propertiesService.search(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a single property by ID' })
  @ApiResponse({
    status: 200,
    description: 'Property retrieved successfully.',
    type: PublicPropertyWithRelations,
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  findOne(
    @Param() { id }: PropertyIdParamDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.propertiesService.findOne(id, user.userId);
  }

  // admin routes secured
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/all')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get a list of all properties' })
  @ApiResponse({
    status: 200,
    description: 'List of properties retrieved successfully.',
    type: [AdminPropertyWithContractsDto],
  })
  getAll() {
    return this.propertiesService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/full-info/:id')
  @Roles('admin', 'superadmin')
  @ApiOperation({
    summary: 'Get a single property by ID with full info [AdminOnly]',
  })
  @ApiResponse({
    status: 200,
    description: 'Property retrieved successfully.',
    type: AdminPropertyWithRelationsDto,
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  findOneFullInfo(@Param() { id }: PropertyIdParamDto) {
    return this.propertiesService.findOneFullInfo(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({
    status: 201,
    description: 'Property created successfully.',
    type: AdminPropertyDto,
  })
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update a property by ID' })
  @ApiResponse({
    status: 200,
    description: 'Property updated successfully.',
    type: AdminPropertyDto,
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  update(@Param() { id }: PropertyIdParamDto, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Delete a property by ID' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  remove(@Param() { id }: PropertyIdParamDto) {
    return this.propertiesService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/enable')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Enable a property (show/make visible) [AdminOnly] - NEW' })
  @ApiResponse({
    status: 200,
    description: 'Property enabled successfully',
    type: AdminPropertyDto,
  })
  enable(@Param() { id }: PropertyIdParamDto) {
    return this.propertiesService.setEnabled(id, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/disable')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Disable a property (hide/make invisible) [AdminOnly] - NEW' })
  @ApiResponse({
    status: 200,
    description: 'Property disabled successfully',
    type: AdminPropertyDto,
  })
  disable(@Param() { id }: PropertyIdParamDto) {
    return this.propertiesService.setEnabled(id, false);
  }
}
