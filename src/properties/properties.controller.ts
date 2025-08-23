import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { Property } from '@prisma/client';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.propertiesService.create(data);
  }

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Property>) {
    return this.propertiesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
