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
import { InvestorProfileDto } from './investorProfile.dto';
import { AppointmentDto } from 'src/appointments/dto/appointments.dto';

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

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+701352652365' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: 'UAE, Dubai' })
  @IsString()
  recidence: string;

  @ApiProperty({ example: 'American' })
  @IsString()
  nationality: string;

  @ApiProperty({ enum: UserRole, example: UserRole.investor })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: Boolean, description: 'Whether the user is enabled (can sign in / interact)' })
  @IsBoolean()
  isEnabled: boolean;

  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  onboardingCompleted: boolean;
}
export class AdminUserDto extends PublicUserDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  // @ApiPropertyOptional({ example: 'reset-token-uuid' })
  // @IsOptional()
  // @IsString()
  // resetToken?: string | null;
}
export class AdminUserWithRelationsDto extends AdminUserDto {
  @ApiProperty({ type: () => InvestorProfileDto, nullable: true })
  investorProfile: InvestorProfileDto | null;

  @ApiProperty({ type: () => [AppointmentDto] })
  appointments: AppointmentDto[];
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
    isEnabled: z.boolean(),
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
