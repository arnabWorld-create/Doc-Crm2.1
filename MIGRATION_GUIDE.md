# API Route Migration Guide

This guide shows how to migrate existing API routes to use the new middleware system.

## Before & After Examples

### Example 1: Simple GET Endpoint

#### Before
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### After
```typescript
import { NextRequest } from 'next/server';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';

export const GET = withMiddleware(
  async (request: NextRequest) => {
    const data = await fetchData();
    return successResponse(data, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);
```

---

### Example 2: POST with Validation

#### Before
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Manual validation
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.email || !body.email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    const result = await saveData(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### After
```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

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

---

### Example 3: With Authentication & Error Handling

#### Before
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const item = await findItem(id);
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    await deleteItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### After
```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { requireAuth } from '@/lib/api-auth';
import { RATE_LIMITS } from '@/lib/rate-limiter';

const schema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const DELETE = withMiddleware(
  async (request: NextRequest, data) => {
    // Check auth
    const { error, user } = await requireAuth(request);
    if (error) throw error;

    const { id } = data;

    const item = await findItem(id);
    if (!item) {
      throw ApiErrors.notFound('Item not found');
    }

    await deleteItem(id);
    return successResponse({ success: true }, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.STRICT,
    validateSchema: schema,
  }
);
```

---

### Example 4: Query Parameter Validation

#### Before
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    if (!page || isNaN(parseInt(page))) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    const pageNum = parseInt(page);
    const limitNum = limit ? parseInt(limit) : 10;

    const results = await fetchPaginated(pageNum, limitNum);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### After
```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';

const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});

export const GET = withMiddleware(
  async (request: NextRequest, data) => {
    const { page, limit = 10 } = data;
    const results = await fetchPaginated(page, limit);
    return successResponse(results, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: querySchema,
    validateSource: 'query',
  }
);
```

---

## Migration Checklist

For each API route, follow these steps:

- [ ] Import required utilities:
  ```typescript
  import { withMiddleware, successResponse } from '@/lib/middleware';
  import { ApiErrors } from '@/lib/api-error';
  import { logger } from '@/lib/logger';
  import { RATE_LIMITS } from '@/lib/rate-limiter';
  ```

- [ ] Define Zod validation schema (if needed):
  ```typescript
  const schema = z.object({
    // Define fields
  });
  ```

- [ ] Replace `export async function` with `export const`:
  ```typescript
  // Before: export async function POST(request)
  // After: export const POST = withMiddleware(...)
  ```

- [ ] Move validation logic to schema
  - Remove manual `if (!field)` checks
  - Use Zod for all validation

- [ ] Replace error responses with `ApiErrors`:
  ```typescript
  // Before: return NextResponse.json({ error: '...' }, { status: 400 })
  // After: throw ApiErrors.badRequest('...')
  ```

- [ ] Replace success responses with `successResponse`:
  ```typescript
  // Before: return NextResponse.json(data, { status: 200 })
  // After: return successResponse(data, 200, request)
  ```

- [ ] Add logging for important events:
  ```typescript
  logger.info('Action completed', { userId, itemId });
  ```

- [ ] Choose appropriate rate limit:
  ```typescript
  rateLimit: RATE_LIMITS.API,  // or AUTH, STRICT, UPLOAD
  ```

- [ ] Test the endpoint with curl or Postman

---

## Common Patterns

### Pattern 1: CRUD Operations

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { RATE_LIMITS } from '@/lib/rate-limiter';

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

// GET all
export const GET = withMiddleware(
  async (request: NextRequest) => {
    const items = await db.findMany();
    return successResponse(items, 200, request);
  },
  { rateLimit: RATE_LIMITS.API }
);

// POST create
export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    const item = await db.create(data);
    logger.info('Item created', { itemId: item.id });
    return successResponse(item, 201, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: createSchema,
  }
);

// PUT update
export const PUT = withMiddleware(
  async (request: NextRequest, data) => {
    const { id, ...updateData } = data;
    const item = await db.findById(id);
    
    if (!item) {
      throw ApiErrors.notFound('Item not found');
    }
    
    const updated = await db.update(id, updateData);
    logger.info('Item updated', { itemId: id });
    return successResponse(updated, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: updateSchema,
  }
);

// DELETE
export const DELETE = withMiddleware(
  async (request: NextRequest, data) => {
    const { id } = data;
    const item = await db.findById(id);
    
    if (!item) {
      throw ApiErrors.notFound('Item not found');
    }
    
    await db.delete(id);
    logger.info('Item deleted', { itemId: id });
    return successResponse({ deleted: true }, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.STRICT,
    validateSchema: z.object({ id: z.string() }),
  }
);
```

---

### Pattern 2: File Upload

```typescript
import { NextRequest } from 'next/server';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { RATE_LIMITS } from '@/lib/rate-limiter';

export const POST = withMiddleware(
  async (request: NextRequest) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw ApiErrors.badRequest('File is required');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw ApiErrors.badRequest('File size exceeds 10MB');
    }

    const url = await uploadFile(file);
    return successResponse({ url }, 201, request);
  },
  {
    rateLimit: RATE_LIMITS.UPLOAD,
  }
);
```

---

### Pattern 3: Search/Filter

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  sort: z.enum(['name', 'date', 'relevance']).optional(),
});

export const GET = withMiddleware(
  async (request: NextRequest, data) => {
    const { q, page = 1, limit = 20, sort = 'relevance' } = data;
    
    const results = await db.search({
      query: q,
      page,
      limit,
      sort,
    });

    return successResponse(results, 200, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: searchSchema,
    validateSource: 'query',
  }
);
```

---

## Testing After Migration

### Unit Test Example

```typescript
import { POST } from './route';

describe('POST /api/items', () => {
  it('should create item with valid data', async () => {
    const request = new Request('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('should reject invalid data', async () => {
    const request = new Request('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);
  });
});
```

---

## Troubleshooting

### Issue: "Cannot find module '@/lib/middleware'"

**Solution**: Make sure the file exists at `lib/middleware.ts`

### Issue: Validation always fails

**Solution**: Check that your schema matches your data structure

### Issue: CORS errors in browser

**Solution**: Add your domain to `allowedOrigins` in `lib/middleware.ts`

### Issue: Rate limit too strict

**Solution**: Adjust limits in `RATE_LIMITS` or use different limits per endpoint

---

## Next Steps

1. Migrate all API routes to use the new middleware
2. Add comprehensive error handling
3. Implement audit logging for sensitive operations
4. Set up monitoring and alerting
5. Add integration tests for all endpoints
