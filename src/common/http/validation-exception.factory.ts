import { BadRequestException, ValidationError } from '@nestjs/common';
import { ApiErrorCode, FieldError } from './api-error';

/**
 * Turns class-validator output into field-level errors.
 *
 * Nest's default flattens everything into a string array like
 * ["email must be an email"], which a form can't map back to an input. This
 * keeps the property name alongside the message, and walks nested DTOs so
 * `investorProfile.phone` comes through with its full path.
 */
export function validationExceptionFactory(errors: ValidationError[]) {
  const details = flatten(errors);

  return new BadRequestException({
    code: ApiErrorCode.VALIDATION_FAILED,
    message:
      details.length === 1
        ? details[0].message
        : `${details.length} fields failed validation.`,
    details,
  });
}

function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  const out: FieldError[] = [];

  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;

    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        out.push({ field, message });
      }
    }

    if (error.children?.length) {
      out.push(...flatten(error.children, field));
    }
  }

  return out;
}
