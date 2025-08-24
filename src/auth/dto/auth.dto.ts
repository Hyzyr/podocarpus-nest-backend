import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({
    example: {
      id: 'uuid',
      email: 'john.doe@example.com',
      role: 'investor',
      isActive: true,
    },
  })
  user: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
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
