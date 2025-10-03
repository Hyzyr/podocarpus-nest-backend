import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum, IsDate } from 'class-validator';
import { PublicPropertyDto } from 'src/properties/dto';
import { PublicUserDto } from 'src/users/dto';
import { dateFromISO, uuid } from 'src/utils/zod-helpers';
import z from 'zod';

export enum AppointmentStatus {
  requested = 'requested', // booking created, waiting for approval
  confirmed = 'confirmed', // scheduled and approved
  completed = 'completed', // appointment done, user visited
  noShow = 'noShow', // user did not attend
  canceled = 'canceled', // appointment canceled
}

export class AppointmentDto {
  @ApiProperty({
    description: 'Unique identifier for the appointment',
    example: 'a3f62b88-ccf7-4b5e-9e4f-1234567890ab',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'ID of the property associated with the appointment',
    example: 'b2d94e77-87af-47ea-9d62-0987654321cd',
  })
  @IsUUID()
  propertyId: string;

  @ApiProperty({
    description: 'ID of the user who booked the appointment',
    example: 'c5e74a12-234f-4c6f-9b8e-4567891230ef',
  })
  @IsUUID()
  bookedById: string;

  @ApiPropertyOptional({
    description: 'ID of the availability slot (optional)',
    example: 'd8a12b34-5678-4abc-9def-6789012345gh',
  })
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @ApiProperty({
    description: 'Current status of the appointment',
    enum: AppointmentStatus,
    example: AppointmentStatus.confirmed,
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({
    description: 'Scheduled date and time of the appointment',
    example: '2025-09-12T14:30:00Z',
  })
  @IsDate()
  scheduledAt: Date;

  @ApiPropertyOptional({
    description: 'Additional notes for the appointment',
    example: 'Please bring all necessary documents.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: () => PublicPropertyDto })
  property: PublicPropertyDto;
}

export class AppointmentWithBookedByDto extends AppointmentDto {
  @ApiProperty({ type: () => PublicUserDto })
  bookedBy: PublicUserDto;
}

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID of the property associated with the appointment',
    example: 'b2d94e77-87af-47ea-9d62-0987654321cd',
  })
  @IsUUID()
  propertyId: string;

  @ApiProperty({
    description: 'ID of the user who booked the appointment',
    example: 'c5e74a12-234f-4c6f-9b8e-4567891230ef',
  })
  @IsUUID()
  bookedById: string;

  @ApiPropertyOptional({
    description: 'ID of the availability slot (optional)',
    example: 'd8a12b34-5678-4abc-9def-6789012345gh',
  })
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @ApiPropertyOptional({
    description: 'Status of the appointment (defaults to requested)',
    enum: AppointmentStatus,
    example: AppointmentStatus.requested,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({
    description: 'Scheduled date and time of the appointment',
    example: '2025-09-12T14:30:00Z',
  })
  @IsDate()
  scheduledAt: Date;

  @ApiPropertyOptional({
    description: 'Additional notes for the appointment',
    example: 'Please bring all necessary documents.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}

export const createAppointmentSchema = z.object({
  propertyId: uuid.describe(
    'ID of the property associated with the appointment',
  ),
  bookedById: uuid.describe('ID of the user who booked the appointment'),
  slotId: uuid
    .describe('ID of the availability slot')
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),

  // Optional; server may default to "requested"
  status: z
    .nativeEnum(AppointmentStatus)
    .describe('Status of the appointment')
    .optional(),

  scheduledAt: dateFromISO.describe(
    'Scheduled date and time (Date or ISO string)',
  ),

  notes: z
    .string()
    .trim()
    .min(1, 'Notes cannot be empty')
    .max(2000, 'Notes is too long')
    .optional(),
});

export const getAppointmentSchema = createAppointmentSchema.extend({
  id: z.string().uuid(),
  // override transformations if needed
  status: z.enum(AppointmentStatus),
  scheduledAt: z.union([z.string().datetime(), z.date()]),
});
