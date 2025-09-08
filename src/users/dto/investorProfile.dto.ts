import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PropertyDto } from 'src/properties/dto';
import { UserDto } from './user.get.dto';
import { IsBoolean } from 'class-validator';

export class InvestorProfileDto {
  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ type: () => UserDto, nullable: true })
  @Type(() => UserDto)
  user?: UserDto | null;

  @ApiPropertyOptional({
    type: () => [PropertyDto],
    description: 'Properties Investor own',
  })
  properties?: PropertyDto[];

  @ApiPropertyOptional({ type: () => UserDto, nullable: true })
  @Type(() => UserDto)
  investorPreferences?: UserDto | null;
}

export class InvestorPreferences {
  @ApiProperty()
  investorProfileId: string;

  @ApiPropertyOptional({ type: () => InvestorProfileDto, nullable: true })
  @Type(() => InvestorProfileDto)
  investorProfile?: InvestorProfileDto | null;

  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  investingInDubai: boolean;

  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  openToJointInvestments: boolean;

  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  wantsAdvisorCall: boolean;

  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  interestedInEvents: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
