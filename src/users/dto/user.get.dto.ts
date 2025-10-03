import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export class UserIdParamDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  id: string;
}

export class PublicUserDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiPropertyOptional({ example: '+701352652365' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string | null;

  @ApiPropertyOptional({ example: 'UAE, Dubai' })
  @IsOptional()
  @IsString()
  recidence?: string | null;

  @ApiPropertyOptional({ example: 'American' })
  @IsOptional()
  @IsString()
  nationality?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.investor })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isActive: boolean;
}
export class AdminUserDto extends PublicUserDto {
  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  onboardingCompleted: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: 'reset-token-uuid' })
  @IsOptional()
  @IsString()
  resetToken?: string | null;
}

export const PublicUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
      .nullable()
      .optional(),
    recidence: z.string().nullable().optional(),
    nationality: z.string().nullable().optional(),
    role: z.nativeEnum(UserRole),
    createdAt: z.union([z.string().datetime(), z.date()]),
    updatedAt: z.union([z.string().datetime(), z.date()]),
    isActive: z.boolean(),
  })
  .strip();

export const AdminUserSchema = PublicUserSchema.extend({
  onboardingCompleted: z.boolean(),
  emailVerified: z.boolean().optional(),
  resetToken: z.string().nullable().optional(),
});

export const publicUserSelect: Record<string, true> = Object.fromEntries(
  Object.keys(PublicUserSchema.shape).map((key) => [key, true]),
);

export type PublicUser = z.infer<typeof PublicUserSchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
