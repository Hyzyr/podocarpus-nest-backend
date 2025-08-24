import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'hashedpassword' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.investor })
  @IsEnum(UserRole)
  role: UserRole;
}
