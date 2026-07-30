/**
 * Stable, machine-readable error codes.
 *
 * Clients should branch on `code`, never on `message`. Messages are prose and
 * will change (wording, translation); codes are part of the API contract and
 * only change with a version bump.
 */
export enum ApiErrorCode {
  // 400
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  BAD_REQUEST = 'BAD_REQUEST',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  // 401 / 403
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  // 404
  NOT_FOUND = 'NOT_FOUND',
  // 409
  CONFLICT = 'CONFLICT',
  UNIQUE_VIOLATION = 'UNIQUE_VIOLATION',
  // 429
  RATE_LIMITED = 'RATE_LIMITED',
  // 500+
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/** One invalid field, so a form can highlight the right input. */
export interface FieldError {
  field: string;
  message: string;
}

/** The body returned for every non-2xx response. */
export interface ApiErrorBody {
  statusCode: number;
  /** Human-readable status, e.g. "Not Found". */
  error: string;
  /** Stable code to branch on. */
  code: ApiErrorCode | string;
  /** Prose explanation. Safe to show a user; do not parse. */
  message: string;
  /** Present on validation failures only. */
  details?: FieldError[];
  path: string;
  timestamp: string;
  /** Echoed from x-request-id; quote this in bug reports. */
  requestId?: string;
}

/** Default code for a status when the thrower didn't specify one. */
export function codeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return ApiErrorCode.BAD_REQUEST;
    case 401:
      return ApiErrorCode.UNAUTHENTICATED;
    case 403:
      return ApiErrorCode.FORBIDDEN;
    case 404:
      return ApiErrorCode.NOT_FOUND;
    case 409:
      return ApiErrorCode.CONFLICT;
    case 429:
      return ApiErrorCode.RATE_LIMITED;
    case 503:
      return ApiErrorCode.SERVICE_UNAVAILABLE;
    default:
      return status >= 500
        ? ApiErrorCode.INTERNAL_ERROR
        : ApiErrorCode.BAD_REQUEST;
  }
}
