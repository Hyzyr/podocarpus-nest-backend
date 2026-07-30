import {
  ArgumentsHost,
  Catch,
  ConflictException,
  BadRequestException,
  NotFoundException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BaseExceptionFilter } from '@nestjs/core';
import { ApiErrorCode } from '../http/api-error';
import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * Maps Prisma's error codes onto HTTP.
 *
 * Without this a duplicate email surfaces as a 500 carrying Prisma's internal
 * message — the client can't tell "you did something invalid" from "the server
 * is broken", and the response leaks schema details. The mapped errors are
 * handed to AllExceptionsFilter so they come out in the same shape as
 * everything else.
 *
 * Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('Prisma');
  private readonly base = new AllExceptionsFilter();

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    this.base.catch(this.toHttp(exception), host);
  }

  private toHttp(e: Prisma.PrismaClientKnownRequestError): HttpException {
    switch (e.code) {
      // Unique constraint failed
      case 'P2002': {
        const fields = this.targets(e);
        const label = fields.length ? fields.join(', ') : 'value';
        return new ConflictException({
          code: ApiErrorCode.UNIQUE_VIOLATION,
          message: `That ${label} is already taken.`,
          ...(fields.length && {
            details: fields.map((field) => ({
              field,
              message: 'Already in use',
            })),
          }),
        });
      }

      // An operation failed because it depends on records that were not found
      case 'P2025':
        return new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: 'The requested record does not exist.',
        });

      // Foreign key constraint failed
      case 'P2003':
        return new BadRequestException({
          code: ApiErrorCode.FOREIGN_KEY_VIOLATION,
          message:
            'That reference points to something that does not exist, or is still in use.',
        });

      // Required relation violation
      case 'P2014':
        return new BadRequestException({
          code: ApiErrorCode.FOREIGN_KEY_VIOLATION,
          message: 'This change would break a required relation.',
        });

      default:
        // Anything unmapped is genuinely unexpected: log it with the Prisma
        // code so the mapping can be extended, and let it fall through as 500.
        this.logger.error(`Unmapped Prisma error ${e.code}: ${e.message}`);
        return new HttpException(
          {
            code: ApiErrorCode.INTERNAL_ERROR,
            message: 'An unexpected database error occurred.',
          },
          500,
        );
    }
  }

  /** P2002 reports the offending column(s) in meta.target. */
  private targets(e: Prisma.PrismaClientKnownRequestError): string[] {
    const target = e.meta?.target;
    if (Array.isArray(target)) return target.map(String);
    if (typeof target === 'string') return [target];
    return [];
  }
}
