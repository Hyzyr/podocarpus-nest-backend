import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import z from 'zod';

export class BindInvestmentDto {
  @ApiProperty({
    description: 'The ID of the property to bind',
    example: 'c1a2b3d4-e5f6-7890-ab12-34567890cdef',
  })
  @IsString()
  @IsUUID()
  propertyId: string;
}

export class PublicPropertyDto  {
  @ApiProperty({ example: 'uuid-123', description: 'Property ID' })
  id: string;

  @ApiProperty({ example: 'Luxury Apartment', description: 'Title' })
  title: string;

  @ApiProperty({ example: '2-bedroom in downtown area', required: false })
  description?: string;

  @ApiProperty({ example: 'New York' })
  city: string;

  @ApiProperty({ example: 'USA' })
  country: string;

  @ApiProperty({ example: 2500, required: false })
  contractValue?: number;

  @ApiProperty({ example: 40.7128, required: false })
  latitude?: number;

  @ApiProperty({ example: -74.006, required: false })
  longitude?: number;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export const PublicPropertySchema = z.object(PublicPropertyDto);