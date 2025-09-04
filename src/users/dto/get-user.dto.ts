import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UserDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ type: String, example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ type: String, example: 'Smith' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ type: String, example: '+701352652365' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ type: String, example: 'UAE, Dubai' })
  @IsOptional()
  @IsString()
  recidence?: string;

  @ApiProperty({ type: String, example: 'American' })
  @IsString()
  nationality: string;

  @ApiProperty({ enum: UserRole, example: UserRole.investor })
  role: UserRole;

  @ApiProperty({ type: Boolean })
  isActive: boolean;
  @ApiProperty({ type: Boolean })
  onboardingCompleted: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
