import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { PublicPropertyDto, PublicPropertySchema } from 'src/properties/dto';
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

export class InvestorPropertyDto extends PublicPropertyDto {
  @ApiProperty({
    example: 5000,
    required: false,
    description: 'Deposit received',
  })
  depositReceived?: number;

  @ApiProperty({ example: 'Bank Transfer', required: false })
  paymentMethod?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', required: false })
  rentStart?: Date;

  @ApiProperty({ example: '2028-01-01T00:00:00.000Z', required: false })
  rentExpiry?: Date;

  @ApiProperty({
    example: 25000,
    required: false,
    description: 'Yearly rent value',
  })
  rentValue?: number;

  @ApiProperty({
    example: 'Low',
    required: false,
    description: 'Vacancy risk level',
  })
  vacancyRisk?: string;
}
export const InvestorPropertySchema = PublicPropertySchema.extend({
  depositReceived: z.number().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  rentStart: z.date().nullable().optional(),
  rentExpiry: z.date().nullable().optional(),
  rentValue: z.number().nullable().optional(),
  rateYear: z.number().nullable().optional(),
  vacancyRisk: z.string().nullable().optional(),
}).strip();

export type InvestorProperty = z.infer<typeof InvestorPropertySchema>;
