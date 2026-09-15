import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * Parse a query-string boolean.
 *
 * Not `@Type(() => Boolean)` — that turns the string "false" into true. An
 * absent param stays `undefined` so the service can tell "not sent" from
 * "sent as false" and apply its own default.
 */
const asBool = () =>
  Transform(({ value }) =>
    value === undefined || value === ''
      ? undefined
      : value === true || value === 'true' || value === '1',
  );

/**
 * Scope and window for the month-by-month collection table.
 *
 * Defaults to the current calendar year, every lease that overlaps it, with
 * each month's payments included.
 */
export class MonthlyViewQueryDto {
  @ApiPropertyOptional({
    description:
      'Calendar year to lay out. Ignored when from/to are supplied. Defaults to the current year.',
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    description:
      'Window start. Snapped to the first of its month. Overrides `year`.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description:
      'Window end. Snapped to the end of its month. Overrides `year`. At most 120 months are returned.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Limit to one property' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({
    description: 'Limit to one lease (single-tenant view)',
  })
  @IsOptional()
  @IsUUID()
  leaseId?: string;

  @ApiPropertyOptional({
    description:
      'Only currently-active leases. Off by default, so past tenants keep their history in the table.',
    default: false,
  })
  @IsOptional()
  @asBool()
  @IsBoolean()
  activeLeasesOnly?: boolean;

  @ApiPropertyOptional({
    description:
      'Drop leases with nothing scheduled and nothing paid in the window. Off by default, so every unit still gets a row.',
    default: false,
  })
  @IsOptional()
  @asBool()
  @IsBoolean()
  hideEmptyRows?: boolean;

  @ApiPropertyOptional({
    description:
      'Embed the payment records in each cell — the per-month history. Turn off for a lighter payload when you only need the paid/unpaid state.',
    default: true,
  })
  @IsOptional()
  @asBool()
  @IsBoolean()
  includePayments?: boolean;
}
