import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client'; // from Prisma enum

export class RegisterDto {
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
