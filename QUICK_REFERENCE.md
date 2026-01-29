# Quick Reference Guide

## Installation

```bash
npm install
```

## Environment Variables

Create `.env.local` with:

```env
# Required
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
NEXT_PUBLIC_SUPABASE_BUCKET="patient-reports"

# Optional - Redis (for distributed rate limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Optional - Sentry (for error tracking)
NEXT_PUBLIC_SENTRY_DSN="https://..."
```

## Common Patterns

### Rate Limiting
```typescript
import { withMiddleware } from '@/lib/middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';

export const GET = withMiddleware(
  async (request) => {
    // Your code
  },
  { rateLimit: RATE_LIMITS.API }
);
```

### RBAC - Require Role
```typescript
import { requireRole } from '@/lib/rbac';

const { error, user } = await requireRole(request, ['doctor', 'admin']);
if (error) throw ApiErrors.forbidden('Insufficient permissions');
```

### RBAC - Require Permission
```typescript
import { requirePermission } from '@/lib/rbac';

const { error, user } = await requirePermission(request, 'patients', 'write');
if (error) throw ApiErrors.forbidden('Cannot write patients');
```

### File Validation
```typescript
import { validateFileOrThrow, FILE_UPLOAD_CONFIGS } from '@/lib/file-upload-validator';

validateFileOrThrow(file, FILE_UPLOAD_CONFIGS.PATIENT_REPORTS);
```

### Error Handling
```typescript
import { ApiErrors } from '@/lib/api-error';
import { successResponse } from '@/lib/middleware';

// Throw errors
throw ApiErrors.notFound('Resource not found');
throw ApiErrors.badRequest('Invalid input');

// Return success
return successResponse({ data }, 200, request);
```

### Error Tracking
```typescript
import { monitoring } from '@/lib/monitoring';

monitoring.captureError(error, { userId, endpoint });
monitoring.setUser({ id, email, name });
```

## Rate Limit Configurations

- `RATE_LIMITS.AUTH` - 5 requests per 15 minutes
- `RATE_LIMITS.API` - 100 requests per minute
- `RATE_LIMITS.STRICT` - 10 requests per minute
- `RATE_LIMITS.UPLOAD` - 20 requests per hour

## File Upload Configurations

- `FILE_UPLOAD_CONFIGS.PATIENT_REPORTS` - 10MB, PDF/Images
- `FILE_UPLOAD_CONFIGS.CLINIC_LOGO` - 2MB, Images
- `FILE_UPLOAD_CONFIGS.IMAGES` - 5MB, Images

## Roles & Permissions

### Roles
- `doctor` - Full medical access
- `admin` - Full system access
- `staff` - Limited access

### Common Permissions
- `patients` - `read`, `write`, `delete`
- `visits` - `read`, `write`, `delete`
- `appointments` - `read`, `write`, `delete`
- `settings` - `read`, `write`

## Error Codes

- `BAD_REQUEST` - 400
- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `CONFLICT` - 409
- `UNPROCESSABLE_ENTITY` - 422
- `RATE_LIMITED` - 429
- `INTERNAL_ERROR` - 500

## See Also

- `IMPLEMENTATION_GUIDE.md` - Detailed guide
- `PRODUCTION_IMPROVEMENTS_SUMMARY.md` - Summary of changes
- `app/api/example-protected-route/route.ts` - Complete example




