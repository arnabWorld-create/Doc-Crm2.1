/**
 * Sanitize errors before sending to the client.
 * Prevents leaking Prisma/DB details, stack traces, or internal messages.
 */

const PRISMA_CODE_MESSAGES: Record<string, string> = {
  P2002: 'A record with this value already exists.',
  P2025: 'Record not found.',
  P2003: 'Invalid reference.',
  P2014: 'The change would violate a required relation.',
};

/**
 * Returns a safe, user-facing message for an error. Never returns raw DB/Prisma messages.
 */
export function sanitizeErrorForClient(error: unknown): string {
  if (error == null) {
    return 'Operation failed.';
  }

  // Prisma known request errors (code is on meta)
  const prismaError = error as { code?: string; meta?: unknown };
  if (typeof prismaError.code === 'string' && PRISMA_CODE_MESSAGES[prismaError.code]) {
    return PRISMA_CODE_MESSAGES[prismaError.code];
  }

  // Our own ApiError is already safe, but we don't have it here in generic sanitizer
  // so we never return error.message for unknown errors in production
  return 'Operation failed.';
}
