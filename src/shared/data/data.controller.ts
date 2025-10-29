import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataService } from './data.service';
import { CountriesDto, NationalityDto } from './data.dto';

@Controller('data')
export class DataController {
  constructor(private dataService: DataService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get list of all countries' })
  @ApiResponse({
    status: 200,
    description: 'List of countries with nationalities and cities',
    type: [CountriesDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCountries() {
    return this.dataService.getAllCountries();
  }

  @Get('countries/:code')
  @ApiOperation({ summary: 'Get details for a specific country by ISO code' })
  @ApiResponse({
    status: 200,
    description: 'Country details with nationality and cities',
    type: CountriesDto,
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async getCountry(@Param('code') code: string) {
    return this.dataService.getCountryByCode(code);
  }

  @Get('nationalities')
  @ApiOperation({ summary: 'Get list of nationalities' })
  @ApiResponse({
    status: 200,
    description: 'List of nationalities by country',
    type: [NationalityDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNationalities() {
    return this.dataService.getNationalities();
  }
}
