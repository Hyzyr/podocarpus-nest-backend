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
import { PropertiesService } from './properties.service';

import { JwtAuthGuard } from 'src/_helpers/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/auth/roles';
import { AdminPropertyDto, AdminPropertyWithContractsDto, AdminPropertyWithRelationsDto, PublicPropertyDto, PublicPropertyWithRelations } from './dto/property.get.dto';
import { FindAllPropertiesQueryDto, PropertyIdParamDto } from './dto/property.query.dto';
import { CreatePropertyDto } from './dto/property.create.dto';
import { UpdatePropertyDto } from './dto/property.update.dto';

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
  findAll(@Query() query?: FindAllPropertiesQueryDto) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single property by ID' })
  @ApiResponse({
    status: 200,
    description: 'Property retrieved successfully.',
    type: PublicPropertyWithRelations,
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  findOne(@Param() { id }: PropertyIdParamDto) {
    return this.propertiesService.findOne(id);
  }

  // admin routes secured
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/all')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a list of all properties' })
  @ApiResponse({
    status: 200,
    description: 'List of properties retrieved successfully.',
    type: [AdminPropertyWithContractsDto],
  })
  getAll() {
    return this.propertiesService.getAll();
  }

  @Get('/full-info/:id')
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
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({
    status: 201,
    description: 'Property created successfully.',
    type: AdminPropertyDto,
  })
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create({
      ...dto,
      rentStart: dto?.rentStart ? new Date(dto.rentStart) : dto?.rentStart,
      rentExpiry: dto?.rentExpiry ? new Date(dto.rentExpiry) : dto?.rentStart,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('admin')
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
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a property by ID' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  remove(@Param() { id }: PropertyIdParamDto) {
    return this.propertiesService.remove(id);
  }
}
