import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import {
  CreatePropertyDto,
  FindAllPropertiesQueryDto,
  PublicPropertyDto,
  PropertyIdParamDto,
  UpdatePropertyDto,
} from './dto';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({
    status: 201,
    description: 'Property created successfully.',
    type: PublicPropertyDto,
  })
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create({
      ...dto,
      rentStart: dto?.rentStart ? new Date(dto.rentStart) : dto?.rentStart,
      rentExpiry: dto?.rentExpiry ? new Date(dto.rentExpiry) : dto?.rentStart,
    });
  }

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
    type: PublicPropertyDto,
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  findOne(@Param() { id }: PropertyIdParamDto) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a property by ID' })
  @ApiResponse({
    status: 200,
    description: 'Property updated successfully.',
    type: PublicPropertyDto,
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  update(@Param() { id }: PropertyIdParamDto, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a property by ID' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  remove(@Param() { id }: PropertyIdParamDto) {
    return this.propertiesService.remove(id);
  }
}
