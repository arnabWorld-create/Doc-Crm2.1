# Implementation Guide - Production Improvements

This document describes the improvements made to address production readiness issues.

## 1. Redis-Based Rate Limiting

### Overview
Rate limiting now supports Redis for distributed systems, with automatic fallback to in-memory storage.

### Setup

#### Option 1: Upstash Redis (Recommended for Vercel)
1. Sign up at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Add environment variables:
```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### Option 2: Self-Hosted Redis
Modify `lib/rate-limiter-redis.ts` to use your Redis instance:
```typescript
import { Redis } from 'ioredis';

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});
```

### Usage
The rate limiter automatically uses Redis if configured, otherwise falls back to in-memory:
```typescript
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limiter-redis';

const { allowed, remaining, reset } = await isRateLimited(
  'user:123',
  RATE_LIMITS.API.limit,
  RATE_LIMITS.API.windowMs
);
```

### Installation
```bash
npm install @upstash/ratelimit @upstash/redis
```

---

## 2. Role-Based Access Control (RBAC)

### Overview
Implemented comprehensive RBAC system with role and permission-based authorization.

### Roles
- **doctor**: Full access to patients, visits, appointments, reports, analytics, and settings
- **admin**: Full access to everything
- **staff**: Read/write access to patients, visits, and appointments (no delete, no settings)

### Usage Examples

#### Require Specific Role
```typescript
import { requireRole } from '@/lib/rbac';

export const POST = withMiddleware(
  async (request: NextRequest) => {
    const { error, user } = await requireRole(request, ['doctor', 'admin']);
    if (error) throw ApiErrors.forbidden('Insufficient permissions');
    
    // User is authenticated and has required role
    // ...
  }
);
```

#### Require Specific Permission
```typescript
import { requirePermission } from '@/lib/rbac';

export const DELETE = withMiddleware(
  async (request: NextRequest) => {
    const { error, user } = await requirePermission(request, 'patients', 'delete');
    if (error) throw ApiErrors.forbidden('Cannot delete patients');
    
    // User has permission to delete patients
    // ...
  }
);
```

#### Using Helper Functions
```typescript
import { withRole, withPermission } from '@/lib/rbac';

// In route handler
const user = await withRole(['doctor', 'admin'])(request);
const user = await withPermission('settings', 'write')(request);
```

### Adding New Permissions
Edit `lib/rbac.ts`:
```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  doctor: [
    // ... existing permissions
    { resource: 'new-resource', action: 'read' },
  ],
};
```

---

## 3. Standardized Error Handling

### Overview
All API routes now use consistent error handling with monitoring integration.

### Error Types
- `ApiErrors.badRequest()` - 400
- `ApiErrors.unauthorized()` - 401
- `ApiErrors.forbidden()` - 403
- `ApiErrors.notFound()` - 404
- `ApiErrors.conflict()` - 409
- `ApiErrors.unprocessableEntity()` - 422
- `ApiErrors.tooManyRequests()` - 429
- `ApiErrors.internalError()` - 500

### Usage
```typescript
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';

export const GET = withMiddleware(
  async (request: NextRequest) => {
    const item = await findItem();
    if (!item) {
      throw ApiErrors.notFound('Item not found');
    }
    
    return successResponse({ data: item }, 200, request);
  }
);
```

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": {
    "field": "validation error"
  }
}
```

---

## 4. File Upload Validation

### Overview
Centralized file upload validation with configurable limits and type checking.

### Predefined Configurations
- `FILE_UPLOAD_CONFIGS.PATIENT_REPORTS` - 10MB, PDF/Images
- `FILE_UPLOAD_CONFIGS.CLINIC_LOGO` - 2MB, Images only
- `FILE_UPLOAD_CONFIGS.IMAGES` - 5MB, Images only

### Usage in API Routes
```typescript
import { validateFileOrThrow, FILE_UPLOAD_CONFIGS } from '@/lib/file-upload-validator';

export const POST = withMiddleware(
  async (request: NextRequest) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw ApiErrors.badRequest('File is required');
    }
    
    // Validate and throw if invalid
    validateFileOrThrow(file, FILE_UPLOAD_CONFIGS.PATIENT_REPORTS);
    
    // File is valid, proceed with upload
    // ...
  }
);
```

### Usage in Components
```typescript
import { validateFile, FILE_UPLOAD_CONFIGS } from '@/lib/file-upload-validator';

const validation = validateFile(file, FILE_UPLOAD_CONFIGS.PATIENT_REPORTS);
if (!validation.valid) {
  setError(validation.error);
  return;
}
```

### Custom Configuration
```typescript
const customConfig = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/png', 'image/jpeg'],
  allowedExtensions: ['.png', '.jpg'],
};

validateFileOrThrow(file, customConfig);
```

### Filename Sanitization
```typescript
import { sanitizeFilename, generateSafeFilename } from '@/lib/file-upload-validator';

const safeName = sanitizeFilename(userInput);
const uniqueName = generateSafeFilename(originalName, 'prefix');
```

---

## 5. Error Tracking & Performance Monitoring

### Overview
Integrated Sentry for error tracking and performance monitoring with graceful fallback.

### Setup

1. **Create Sentry Account**
   - Sign up at [sentry.io](https://sentry.io/)
   - Create a new project (Next.js)
   - Get your DSN

2. **Install Dependencies**
   ```bash
   npm install @sentry/nextjs
   ```

3. **Add Environment Variable**
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

4. **Initialize Sentry** (Optional - auto-initialized)
   Create `sentry.client.config.ts` and `sentry.server.config.ts` if you need custom configuration.

### Usage

#### Manual Error Tracking
```typescript
import { monitoring } from '@/lib/monitoring';

try {
  // Your code
} catch (error) {
  monitoring.captureError(error, {
    userId: user.id,
    endpoint: '/api/patients',
  });
}
```

#### Performance Tracking
```typescript
import { withPerformanceTracking } from '@/lib/monitoring';

const trackedFunction = withPerformanceTracking(
  async (data: any) => {
    // Your function
  },
  'process_patient_data'
);
```

#### Set User Context
```typescript
import { monitoring } from '@/lib/monitoring';

monitoring.setUser({
  id: user.id,
  email: user.email,
  name: user.name,
});
```

#### Add Breadcrumbs
```typescript
monitoring.addBreadcrumb(
  'User performed action',
  'user.action',
  'info',
  { action: 'create_patient' }
);
```

### Automatic Integration
- All API errors are automatically tracked
- Performance metrics are automatically collected
- User context is set from authentication

---

## Migration Checklist

### For Existing Routes

1. **Update Rate Limiting**
   - ✅ Already using `withMiddleware` - no changes needed
   - Rate limiting now uses Redis automatically if configured

2. **Add Authorization**
   ```typescript
   // Before
   const { error, user } = await requireAuth(request);
   
   // After (if role-based)
   const { error, user } = await requireRole(request, ['doctor', 'admin']);
   
   // Or (if permission-based)
   const { error, user } = await requirePermission(request, 'patients', 'write');
   ```

3. **Standardize Error Handling**
   ```typescript
   // Before
   return NextResponse.json({ error: 'Not found' }, { status: 404 });
   
   // After
   throw ApiErrors.notFound('Resource not found');
   ```

4. **Add File Validation**
   ```typescript
   // Before
   if (file.size > 10 * 1024 * 1024) {
     return NextResponse.json({ error: 'File too large' }, { status: 400 });
   }
   
   // After
   validateFileOrThrow(file, FILE_UPLOAD_CONFIGS.PATIENT_REPORTS);
   ```

---

## Environment Variables

Add these to your `.env.local`:

```env
# Redis (Optional - for distributed rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Sentry (Optional - for error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

## Testing

### Test Rate Limiting
```bash
# Make multiple rapid requests
for i in {1..10}; do
  curl http://localhost:3000/api/patients
done
```

### Test RBAC
```typescript
// Test with different roles
const { error } = await requireRole(request, ['admin']);
// Should fail for 'staff' role
```

### Test File Validation
```typescript
// Test with invalid file
const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'test.pdf');
validateFileOrThrow(largeFile, FILE_UPLOAD_CONFIGS.PATIENT_REPORTS);
// Should throw ApiError
```

---

## Performance Considerations

1. **Rate Limiting**: Redis adds ~5-10ms latency per request
2. **RBAC**: Adds one database query per protected route
3. **Error Tracking**: Sentry is async and non-blocking
4. **File Validation**: Client-side validation reduces server load

---

## Troubleshooting

### Redis Not Working
- Check environment variables
- Verify Redis connection
- Check logs for fallback messages
- System will automatically use in-memory fallback

### Sentry Not Capturing Errors
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set
- Check browser console for Sentry initialization
- Verify Sentry project settings

### RBAC Permission Denied
- Check user role in database
- Verify permission configuration in `lib/rbac.ts`
- Check if user account is active

---

## Next Steps

1. ✅ Install dependencies: `npm install @upstash/ratelimit @upstash/redis @sentry/nextjs`
2. ✅ Set up Upstash Redis account
3. ✅ Set up Sentry account
4. ✅ Add environment variables
5. ✅ Test in development
6. ✅ Deploy to production

---

For questions or issues, refer to:
- [Upstash Documentation](https://docs.upstash.com/)
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [RBAC Implementation](./lib/rbac.ts)
- [File Upload Validator](./lib/file-upload-validator.ts)



