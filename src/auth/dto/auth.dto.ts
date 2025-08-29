import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import z from 'zod';

export class AuthUserDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.investor })
  role: UserRole;

  @ApiProperty({ type: Boolean })
  onboardingCompleted: boolean;
}
export const authUserParser: z.ZodType<AuthUserDto> = z.any();

export class LoginBodyDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  password: string;
}
export class RegisterBodyDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6, example: 'securePassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.investor })
  @IsEnum(UserRole)
  role: UserRole;
}
export class AuthResponseDto {
  @ApiProperty()
  user: AuthUserDto;

  // @ApiProperty({
  //   description: 'JWT access token',
  //   example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  // })
  // access_token: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'newSecurePassword456' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
export class RequestPasswordResetDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}
export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'newSecurePassword456' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
