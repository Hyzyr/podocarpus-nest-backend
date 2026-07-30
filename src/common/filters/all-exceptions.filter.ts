import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiErrorBody, ApiErrorCode, codeForStatus } from '../http/api-error';

/**
 * Turns every uncaught error into one predictable body.
 *
 * Nest's default already returns { statusCode, message, error }; this adds the
 * pieces that make a failure actionable — a stable `code` to branch on, the
 * request path, and the request id to quote in a bug report. Unexpected errors
 * are logged with their stack but reported to the client as a bare 500, so
 * internals never leak.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { status, message, code, details } = this.describe(exception);

    const body: ApiErrorBody = {
      statusCode: status,
      error: HttpStatus[status] ? this.titleCase(HttpStatus[status]) : 'Error',
      code,
      message,
      ...(details && { details }),
      path: request.url,
      timestamp: new Date().toISOString(),
      // Fastify assigns every request an id (see genReqId in main.ts).
      requestId: request.id,
    };

    // 5xx means we broke something — keep the stack. 4xx is the caller's
    // problem and would only be noise at error level.
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status} ${code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${status} ${code}`);
    }

    reply.status(status).send(body);
  }

  private describe(exception: unknown): {
    status: number;
    message: string;
    code: string;
    details?: ApiErrorBody['details'];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { status, message: res, code: codeForStatus(status) };
      }

      // Our ValidationPipe factory produces { code, message, details };
      // Nest's built-ins produce { message: string | string[] }.
      const obj = res as {
        message?: string | string[];
        code?: string;
        details?: ApiErrorBody['details'];
      };

      const message = Array.isArray(obj.message)
        ? obj.message.join('; ')
        : (obj.message ?? exception.message);

      return {
        status,
        message,
        code: obj.code ?? codeForStatus(status),
        details: obj.details,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      // Never surface the raw error text — it can carry query fragments,
      // file paths or connection strings.
      message: 'An unexpected error occurred. Please try again.',
      code: ApiErrorCode.INTERNAL_ERROR,
    };
  }

  /** HttpStatus enum keys are SCREAMING_SNAKE; the body reads better as prose. */
  private titleCase(key: string): string {
    return key
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
