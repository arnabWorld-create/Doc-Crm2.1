/**
 * Custom API error class for consistent error handling
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code || 'INTERNAL_ERROR',
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

// Common error factory functions
export const ApiErrors = {
  badRequest: (message: string, details?: Record<string, any>) =>
    new ApiError(400, message, 'BAD_REQUEST', details),

  unauthorized: (message = 'Unauthorized') =>
    new ApiError(401, message, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    new ApiError(403, message, 'FORBIDDEN'),

  notFound: (message = 'Not found') =>
    new ApiError(404, message, 'NOT_FOUND'),

  conflict: (message: string) =>
    new ApiError(409, message, 'CONFLICT'),

  unprocessableEntity: (message: string, details?: Record<string, any>) =>
    new ApiError(422, message, 'UNPROCESSABLE_ENTITY', details),

  tooManyRequests: (message = 'Too many requests') =>
    new ApiError(429, message, 'RATE_LIMITED'),

  internalError: (message = 'Internal server error') =>
    new ApiError(500, message, 'INTERNAL_ERROR'),

  serviceUnavailable: (message = 'Service unavailable') =>
    new ApiError(503, message, 'SERVICE_UNAVAILABLE'),
};
