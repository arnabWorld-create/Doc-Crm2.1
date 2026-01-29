# Quick Start: Security & Reliability Features

## 🚀 What's New

Your Doctor CRM now has enterprise-grade security and reliability features:

1. **Centralized Error Handling & Logging** - Track all errors and important events
2. **Rate Limiting** - Protect against abuse (5 requests/15min for auth, 100/min for API)
3. **Backend Input Validation** - Validate all incoming data with Zod schemas
4. **CORS Configuration** - Secure cross-origin requests
5. **Security Headers** - Protect against common web vulnerabilities

## 📁 New Files

```
lib/
├── logger.ts              # Structured logging system
├── rate-limiter.ts        # Rate limiting with automatic cleanup
├── api-error.ts           # Custom error class with factories
└── middleware.ts          # Request validation & security middleware

Documentation/
├── SECURITY_AND_RELIABILITY.md  # Complete guide (400+ lines)
├── MIGRATION_GUIDE.md           # How to update API routes
├── IMPLEMENTATION_SUMMARY.md    # Overview of changes
└── QUICK_START_SECURITY.md      # This file
```

## ✅ Updated API Routes

These routes now have full security features:

- ✅ `POST /api/auth/login` - Rate limited, validated, logged
- ✅ `POST /api/auth/register` - Rate limited, validated, logged
- ✅ `GET /api/patients` - Rate limited, validated, logged
- ✅ `POST /api/patients` - Rate limited, validated, logged

## 🔧 How to Use

### For New API Routes

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { RATE_LIMITS } from '@/lib/rate-limiter';

// 1. Define validation schema
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

// 2. Create handler with middleware
export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    // data is already validated
    const result = await saveData(data);
    return successResponse(result, 201, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: schema,
  }
);
```

### For Existing API Routes

See `MIGRATION_GUIDE.md` for step-by-step examples.

## 📊 Rate Limits

```typescript
RATE_LIMITS.AUTH      // 5 requests per 15 minutes (login, register)
RATE_LIMITS.API       // 100 requests per minute (general API)
RATE_LIMITS.STRICT    // 10 requests per minute (sensitive operations)
RATE_LIMITS.UPLOAD    // 20 requests per hour (file uploads)
```

## 🛡️ Error Handling

```typescript
// Throw errors in your handlers
throw ApiErrors.badRequest('Invalid input');
throw ApiErrors.unauthorized('Invalid credentials');
throw ApiErrors.forbidden('Access denied');
throw ApiErrors.notFound('Not found');
throw ApiErrors.conflict('Already exists');
throw ApiErrors.tooManyRequests('Rate limited');
throw ApiErrors.internalError('Server error');

// Errors are automatically caught and formatted
// Response: { error: "...", code: "...", statusCode: 400, details: {...} }
```

## 📝 Logging

```typescript
import { logger } from '@/lib/logger';

// Log important events
logger.info('User logged in', { email: user.email });
logger.warn('Suspicious activity', { ip, action: 'failed_login' });
logger.error('Database error', error, { endpoint: '/api/patients' });
```

## 🌐 CORS

Allowed origins (configured in `lib/middleware.ts`):
- http://localhost:3000
- http://localhost:3001
- NEXT_PUBLIC_APP_URL (from environment)

Add your domain to `.env.local`:
```env
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## 🧪 Testing

### Test Rate Limiting
```bash
# This will hit the rate limit after 5 requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
  echo "Request $i"
done
```

### Test Validation
```bash
# This will fail validation
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"invalid"}'

# Response:
# {
#   "error": "Validation failed",
#   "code": "UNPROCESSABLE_ENTITY",
#   "statusCode": 422,
#   "details": {
#     "name": "Name is required",
#     "email": "Invalid email"
#   }
# }
```

### Test CORS
```bash
curl -X OPTIONS http://localhost:3000/api/patients \
  -H "Origin: http://localhost:3001" \
  -v
```

## 📚 Documentation

- **SECURITY_AND_RELIABILITY.md** - Complete implementation guide
- **MIGRATION_GUIDE.md** - How to update existing API routes
- **IMPLEMENTATION_SUMMARY.md** - Overview of all changes

## 🎯 Next Steps

1. **Update Remaining API Routes**
   - Follow the pattern in updated routes
   - See `MIGRATION_GUIDE.md` for examples

2. **Add External Logging** (Optional)
   - Integrate Sentry for error tracking
   - Update `lib/logger.ts` to send to external service

3. **Implement Additional Features**
   - Email notifications
   - SMS integration
   - Audit logging
   - 2FA authentication

4. **Test Everything**
   - Test rate limiting
   - Test validation
   - Test error handling
   - Test CORS

## 🚨 Common Issues

### Rate Limit Too Strict?
Adjust in `lib/rate-limiter.ts`:
```typescript
AUTH: { limit: 10, windowMs: 15 * 60 * 1000 }, // Increase limit
```

### Validation Always Fails?
Check your schema matches your data:
```typescript
// Make sure optional fields use .optional()
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(), // Optional field
});
```

### CORS Errors?
Add your domain to `lib/middleware.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://yourdomain.com', // Add your domain
];
```

## 💡 Pro Tips

1. **Use Specific Error Messages**
   ```typescript
   // ✅ Good
   throw ApiErrors.badRequest('Email already exists');
   
   // ❌ Bad
   throw ApiErrors.badRequest('Invalid input');
   ```

2. **Log Context Information**
   ```typescript
   // ✅ Good
   logger.info('Patient created', { patientId, patientName });
   
   // ❌ Bad
   logger.info('Patient created');
   ```

3. **Use Appropriate Rate Limits**
   ```typescript
   // ✅ Good
   rateLimit: RATE_LIMITS.AUTH,  // For login/register
   rateLimit: RATE_LIMITS.STRICT, // For sensitive operations
   
   // ❌ Bad
   rateLimit: RATE_LIMITS.API,   // For everything
   ```

4. **Validate Early**
   ```typescript
   // ✅ Good - validation happens automatically
   export const POST = withMiddleware(handler, {
     validateSchema: schema,
   });
   
   // ❌ Bad - manual validation
   if (!data.name) throw new Error('...');
   ```

## 📞 Support

For detailed information:
1. Read `SECURITY_AND_RELIABILITY.md` for complete guide
2. Check `MIGRATION_GUIDE.md` for examples
3. Review updated API routes for patterns
4. Check server logs for errors

## ✨ Summary

Your API is now:
- ✅ **Secure** - Input validation, CORS, security headers
- ✅ **Reliable** - Error handling, logging, rate limiting
- ✅ **Maintainable** - Consistent patterns, clear documentation
- ✅ **Production-Ready** - Enterprise-grade features

Happy coding! 🚀
