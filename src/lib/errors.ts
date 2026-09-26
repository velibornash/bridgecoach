/**
 * Shared HTTP-shaped error.
 *
 * Lives in its own module so both `db.ts` (which raises 401 when unauthenticated)
 * and `apiRoute.ts` (which maps errors to responses) can use it without a
 * circular import.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function badRequest(message: string, code = "VALIDATION_ERROR") {
  return new ApiError(400, message, code);
}

export function notFound(message = "Resource not found") {
  return new ApiError(404, message, "NOT_FOUND");
}

export function forbidden(message = "Not permitted") {
  return new ApiError(403, message, "FORBIDDEN");
}

export function unauthorized(message = "You must be signed in to access this.") {
  return new ApiError(401, message, "NOT_AUTHENTICATED");
}
