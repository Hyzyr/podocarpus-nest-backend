import { ApiProperty } from '@nestjs/swagger';

export class CountriesDto {
  @ApiProperty({ example: 'US', description: 'ISO 2-letter country code' })
  code: string;

  @ApiProperty({ example: 'United States', description: 'Full country name' })
  name: string;

  @ApiProperty({ example: 'North America', description: 'Continent name' })
  continent: string;

  @ApiProperty({
    example: 'American',
    description: 'Official nationality/demonym',
  })
  nationality: string;

  @ApiProperty({
    example: ['New York', 'Los Angeles'],
    description: 'Major cities in the country',
    type: [String],
  })
  cities: string[];
}
export class NationalityDto {
  @ApiProperty({ example: 'US', description: 'ISO 2-letter country code' })
  code: string;

  @ApiProperty({
    example: 'American',
    description: 'Official nationality/demonym',
  })
  nationality: string;
}
