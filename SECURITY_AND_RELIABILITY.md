# Security & Reliability Implementation Guide

This document outlines the security and reliability features implemented in the Doctor CRM application.

## Overview

The following systems have been implemented to improve security, reliability, and maintainability:

1. **Centralized Error Handling & Logging**
2. **Rate Limiting**
3. **Backend Input Validation**
4. **CORS Configuration**
5. **Request Validation Middleware**

---

## 1. Centralized Error Handling & Logging

### Location
- `lib/logger.ts` - Centralized logging system
- `lib/api-error.ts` - Custom API error class

### Features

#### Logger (`lib/logger.ts`)
- Structured logging with timestamps
- Log levels: DEBUG, INFO, WARN, ERROR
- Context-aware logging (userId, endpoint, statusCode, duration, etc.)
- Ready for integration with external services (Sentry, LogRocket, etc.)

#### API Error (`lib/api-error.ts`)
- Consistent error responses across all endpoints
- Predefined error factory functions
- Proper HTTP status codes
- Error codes for client-side handling

### Usage

```typescript
import { logger } from '@/lib/logger';
import { ApiErrors } from '@/lib/api-error';

// Logging
logger.info('User logged in', { userId: user.id, email: user.email });
logger.error('Database error', error, { endpoint: '/api/patients' });

// Error handling
throw ApiErrors.badRequest('Invalid input', { field: 'email' });
throw ApiErrors.unauthorized('Invalid credentials');
throw ApiErrors.notFound('Patient not found');
```

### Log Output Example
```
[2024-01-15T10:30:45.123Z] [INFO] User logged in | {"userId":"user123","email":"doctor@clinic.com"}
[2024-01-15T10:30:46.456Z] [ERROR] Database error | {"errorMessage":"Connection timeout","endpoint":"/api/patients"}
```

---

## 2. Rate Limiting

### Location
- `lib/rate-limiter.ts` - In-memory rate limiter

### Features

- In-memory rate limiting (suitable for single-server deployments)
- Configurable limits and time windows
- Automatic cleanup of expired entries
- Predefined configurations for different endpoint types

### Predefined Limits

```typescript
RATE_LIMITS = {
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 },      // 5 requests per 15 minutes
  API: { limit: 100, windowMs: 60 * 1000 },          // 100 requests per minute
  STRICT: { limit: 10, windowMs: 60 * 1000 },        // 10 requests per minute
  UPLOAD: { limit: 20, windowMs: 60 * 60 * 1000 },   // 20 requests per hour
};
```

### Usage

```typescript
import { withMiddleware, RATE_LIMITS } from '@/lib/middleware';

export const POST = withMiddleware(
  async (request, data) => {
    // Your handler
  },
  {
    rateLimit: RATE_LIMITS.AUTH,  // Apply rate limiting
  }
);
```

### Response Headers

When rate limited, the API returns:
- Status: `429 Too Many Requests`
- Header: `Retry-After: <seconds>`

### Production Considerations

For production deployments with multiple servers, consider:
- Redis-based rate limiting
- Distributed rate limiting service
- API Gateway rate limiting (AWS API Gateway, Cloudflare, etc.)

---

## 3. Backend Input Validation

### Location
- `lib/middleware.ts` - `validateRequest()` function

### Features

- Zod schema validation
- Validates both request body and query parameters
- Returns detailed validation errors
- Prevents invalid data from reaching business logic

### Validation Schemas

Define schemas using Zod:

```typescript
import { z } from 'zod';

const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().int().min(0).max(150).optional(),
});
```

### Usage

```typescript
export const POST = withMiddleware(
  async (request, data) => {
    // data is already validated
    console.log(data); // Type-safe validated data
  },
  {
    validateSchema: createPatientSchema,
    validateSource: 'body', // or 'query'
  }
);
```

### Error Response

```json
{
  "error": "Validation failed",
  "code": "UNPROCESSABLE_ENTITY",
  "statusCode": 422,
  "details": {
    "name": "Name is required",
    "email": "Invalid email"
  }
}
```

---

## 4. CORS Configuration

### Location
- `lib/middleware.ts` - `withCORS()` function

### Features

- Configurable allowed origins
- Supports credentials
- Proper CORS headers
- CORS preflight handling

### Allowed Origins

Configure in `lib/middleware.ts`:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);
```

### CORS Headers

The middleware automatically sets:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Credentials`
- `Access-Control-Max-Age`

### Environment Setup

Add to `.env.local`:

```env
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

---

## 5. Request Validation Middleware

### Location
- `lib/middleware.ts` - `withMiddleware()` wrapper

### Features

- Combines all security features
- Error handling
- Logging
- Rate limiting
- Input validation
- CORS headers
- Security headers

### Security Headers Applied

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### Complete Example

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    // data is validated, rate limited, and logged
    const result = await saveData(data);
    return successResponse(result, 201, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: schema,
    validateSource: 'body',
  }
);
```

---

## Updated API Routes

The following API routes have been updated with the new middleware:

### Authentication Routes
- `app/api/auth/login/route.ts` - Login with rate limiting (5 requests/15 min)
- `app/api/auth/register/route.ts` - Registration with rate limiting

### Patient Routes
- `app/api/patients/route.ts` - Get/Create patients with validation

### How to Update Other Routes

1. Import the middleware:
```typescript
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';
```

2. Define validation schema:
```typescript
const schema = z.object({
  // Define your fields
});
```

3. Wrap your handler:
```typescript
export const POST = withMiddleware(
  async (request, data) => {
    // Your logic
    return successResponse(result, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: schema,
  }
);
```

---

## Error Handling Best Practices

### Throw Errors in Handlers

```typescript
export const DELETE = withMiddleware(
  async (request, data) => {
    const item = await db.find(data.id);
    
    if (!item) {
      throw ApiErrors.notFound('Item not found');
    }
    
    if (!canDelete(item)) {
      throw ApiErrors.forbidden('Cannot delete this item');
    }
    
    await db.delete(item.id);
    return successResponse({ deleted: true }, 200, request);
  }
);
```

### Error Response Format

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": {} // Optional
}
```

---

## Logging Best Practices

### Log Important Events

```typescript
logger.info('Patient created', {
  userId: user.id,
  patientId: patient.id,
  patientName: patient.name,
});

logger.warn('Suspicious activity', {
  userId: user.id,
  action: 'multiple_failed_logins',
  ip: getClientIp(request),
});

logger.error('Database connection failed', error, {
  endpoint: '/api/patients',
  retryCount: 3,
});
```

### Avoid Logging Sensitive Data

```typescript
// ❌ DON'T log passwords or tokens
logger.info('User data', { password: user.password });

// ✅ DO log only necessary info
logger.info('User logged in', { userId: user.id, email: user.email });
```

---

## Testing Rate Limits

### Using curl

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
  echo "Request $i"
done
```

### Expected Response (after limit exceeded)

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "statusCode": 429
}
```

---

## Production Deployment

### Environment Variables

```env
# Required
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Optional - for external logging
SENTRY_DSN="https://your-sentry-dsn"
LOG_LEVEL="info"

# Optional - for Redis-based rate limiting
REDIS_URL="redis://your-redis-url"
```

### Recommendations

1. **Logging Service**: Integrate with Sentry, LogRocket, or similar
2. **Rate Limiting**: Use Redis for distributed rate limiting
3. **Monitoring**: Set up alerts for error rates and rate limit hits
4. **Security**: Enable HTTPS, use secure cookies, implement CSRF protection
5. **Backup**: Regular database backups and disaster recovery plan

---

## Troubleshooting

### Rate Limit Issues

**Problem**: Legitimate requests are being rate limited

**Solution**:
- Increase the limit in `RATE_LIMITS`
- Use different limits for different user roles
- Implement user-based rate limiting instead of IP-based

### Validation Errors

**Problem**: Valid requests are being rejected

**Solution**:
- Check the validation schema matches your data
- Review error details in the response
- Add `.optional()` or `.nullable()` for optional fields

### CORS Errors

**Problem**: Frontend requests are blocked

**Solution**:
- Add your domain to `allowedOrigins` in `lib/middleware.ts`
- Set `NEXT_PUBLIC_APP_URL` environment variable
- Check browser console for specific CORS error

---

## Next Steps

1. Update remaining API routes to use the new middleware
2. Integrate with external logging service (Sentry)
3. Set up monitoring and alerting
4. Implement Redis-based rate limiting for production
5. Add audit logging for sensitive operations
6. Implement 2FA for authentication
7. Add password reset functionality

---

## References

- [Zod Documentation](https://zod.dev)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [CORS Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
