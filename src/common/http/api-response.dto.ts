import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiErrorCode } from './api-error';

/** One invalid field in a validation failure. */
export class FieldErrorDto {
  @ApiProperty({ example: 'email' })
  field: string;

  @ApiProperty({ example: 'email must be an email' })
  message: string;
}

/** The body of every non-2xx response. */
export class ApiErrorDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({
    enum: ApiErrorCode,
    example: ApiErrorCode.NOT_FOUND,
    description:
      'Stable machine-readable code. Branch on this, never on `message`.',
  })
  code: string;

  @ApiProperty({ example: 'Notification not found' })
  message: string;

  @ApiPropertyOptional({
    type: [FieldErrorDto],
    description: 'Present on validation failures only.',
  })
  details?: FieldErrorDto[];

  @ApiProperty({ example: '/api/notifications/abc' })
  path: string;

  @ApiProperty({ example: '2026-07-31T09:12:33.001Z' })
  timestamp: string;

  @ApiPropertyOptional({
    example: 'f3a9c1d2',
    description:
      'Echoed from the x-request-id header. Quote it in bug reports.',
  })
  requestId?: string;
}

/**
 * Result of an action that changes state but returns no resource
 * (mark read, resolve, dismiss…).
 */
export class ActionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notification marked as read' })
  message: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Rows affected, for bulk actions.',
  })
  updated?: number;
}

/**
 * Envelope for paginated collections.
 *
 * Lists previously returned a bare array, so a client had no way to know the
 * total and could not render pagination. Single resources are still returned
 * unwrapped — only collections get this.
 */
export class PaginatedDto<T> {
  items: T[];

  @ApiProperty({
    example: 120,
    description: 'Total matching rows, ignoring paging.',
  })
  total: number;

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;

  @ApiProperty({ example: true, description: 'Whether another page exists.' })
  hasMore: boolean;
}

/** Build a paginated envelope. */
export function paginated<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number,
): PaginatedDto<T> {
  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  };
}

/**
 * Swagger helper: describes a paginated response of `model`.
 * Generics are erased at runtime, so the schema has to be built by hand.
 */
export const paginatedSchema = (ref: string) => ({
  allOf: [
    { $ref: `#/components/schemas/PaginatedDto` },
    {
      properties: {
        items: {
          type: 'array',
          items: { $ref: `#/components/schemas/${ref}` },
        },
      },
    },
  ],
});
