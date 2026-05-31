import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  AppSubscriptionStatus,
  BillingCheckoutStatus,
  BillingInterval,
  BillingInvoiceStatus,
  BillingPlanStatus,
  BillingProvider,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBillingPlanDto {
  @ApiProperty({
    example: 'pro_monthly',
    description: 'Stable app-facing plan code',
  })
  @IsString()
  @MaxLength(80)
  readonly code: string = undefined as unknown as string;

  @ApiProperty({ example: 'Pro Monthly' })
  @IsString()
  @MaxLength(120)
  readonly name: string = undefined as unknown as string;

  @ApiPropertyOptional({
    example: 'Unlocks paid investor tools and premium app features.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({
    example: 4900,
    description: 'Amount in minor units, e.g. cents/fils',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly priceAmount: number = undefined as unknown as number;

  @ApiPropertyOptional({ example: 'usd', default: 'usd' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ enum: BillingInterval, example: BillingInterval.month })
  @IsEnum(BillingInterval)
  readonly interval: BillingInterval = undefined as unknown as BillingInterval;

  @ApiPropertyOptional({
    type: [String],
    example: ['premium_dashboard', 'priority_support'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    enum: BillingPlanStatus,
    default: BillingPlanStatus.active,
  })
  @IsOptional()
  @IsEnum(BillingPlanStatus)
  status?: BillingPlanStatus;

  @ApiPropertyOptional({ example: 'price_123' })
  @IsOptional()
  @IsString()
  stripePriceId?: string | null;

  @ApiPropertyOptional({ example: 'P-123' })
  @IsOptional()
  @IsString()
  paypalPlanId?: string | null;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;
}

export class UpdateBillingPlanDto extends PartialType(CreateBillingPlanDto) {}

export class CreateBillingCheckoutDto {
  @ApiProperty({ description: 'Billing plan ID' })
  @IsUUID()
  readonly planId: string = undefined as unknown as string;

  @ApiProperty({ enum: BillingProvider, example: BillingProvider.stripe })
  @IsEnum(BillingProvider)
  readonly provider: BillingProvider = undefined as unknown as BillingProvider;
}

export class CreateBillingPortalDto {
  @ApiPropertyOptional({ example: 'https://pdcps.co/account/billing' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  returnUrl?: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description:
      'Optional subscription ID. Defaults to current active subscription.',
  })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;
}

export class BillingPlanDto {
  @ApiProperty()
  readonly id: string = undefined as unknown as string;

  @ApiProperty()
  readonly code: string = undefined as unknown as string;

  @ApiProperty()
  readonly name: string = undefined as unknown as string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  readonly priceAmount: number = undefined as unknown as number;

  @ApiProperty()
  readonly currency: string = undefined as unknown as string;

  @ApiProperty({ enum: BillingInterval })
  readonly interval: BillingInterval = undefined as unknown as BillingInterval;

  @ApiProperty({ type: [String] })
  readonly features: string[] = undefined as unknown as string[];

  @ApiProperty({ enum: BillingPlanStatus })
  readonly status: BillingPlanStatus =
    undefined as unknown as BillingPlanStatus;

  @ApiPropertyOptional()
  stripePriceId?: string | null;

  @ApiPropertyOptional()
  paypalPlanId?: string | null;

  @ApiProperty()
  readonly displayOrder: number = undefined as unknown as number;

  @ApiProperty({ type: String, format: 'date-time' })
  readonly createdAt: Date = undefined as unknown as Date;

  @ApiProperty({ type: String, format: 'date-time' })
  readonly updatedAt: Date = undefined as unknown as Date;
}

export class BillingCheckoutResponseDto {
  @ApiProperty()
  readonly id: string = undefined as unknown as string;

  @ApiProperty({ enum: BillingProvider })
  readonly provider: BillingProvider = undefined as unknown as BillingProvider;

  @ApiProperty({ enum: BillingCheckoutStatus })
  readonly status: BillingCheckoutStatus =
    undefined as unknown as BillingCheckoutStatus;

  @ApiPropertyOptional()
  providerSessionId?: string | null;

  @ApiPropertyOptional()
  checkoutUrl?: string | null;
}

export class BillingPortalResponseDto {
  @ApiProperty()
  readonly url: string = undefined as unknown as string;
}

export class BillingSubscriptionDto {
  @ApiProperty()
  readonly id: string = undefined as unknown as string;

  @ApiProperty({ enum: BillingProvider })
  readonly provider: BillingProvider = undefined as unknown as BillingProvider;

  @ApiProperty({ enum: AppSubscriptionStatus })
  readonly status: AppSubscriptionStatus =
    undefined as unknown as AppSubscriptionStatus;

  @ApiPropertyOptional()
  providerCustomerId?: string | null;

  @ApiPropertyOptional()
  providerSubscriptionId?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  currentPeriodStart?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  currentPeriodEnd?: Date | null;

  @ApiProperty()
  readonly cancelAtPeriodEnd: boolean = undefined as unknown as boolean;

  @ApiPropertyOptional({ type: BillingPlanDto })
  plan?: BillingPlanDto;
}

export class BillingInvoiceDto {
  @ApiProperty()
  readonly id: string = undefined as unknown as string;

  @ApiProperty({ enum: BillingProvider })
  readonly provider: BillingProvider = undefined as unknown as BillingProvider;

  @ApiProperty({ enum: BillingInvoiceStatus })
  readonly status: BillingInvoiceStatus =
    undefined as unknown as BillingInvoiceStatus;

  @ApiProperty()
  readonly amountDue: number = undefined as unknown as number;

  @ApiProperty()
  readonly amountPaid: number = undefined as unknown as number;

  @ApiProperty()
  readonly currency: string = undefined as unknown as string;

  @ApiPropertyOptional()
  hostedInvoiceUrl?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  paidAt?: Date | null;
}

export class BillingWebhookResponseDto {
  @ApiProperty()
  readonly received: boolean = undefined as unknown as boolean;

  @ApiPropertyOptional()
  duplicate?: boolean;
}
