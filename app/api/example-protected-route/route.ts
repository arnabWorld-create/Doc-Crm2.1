/**
 * Example API route demonstrating all new features:
 * - Redis-based rate limiting
 * - Role-based access control
 * - Standardized error handling
 * - File upload validation
 * - Error tracking integration
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { requirePermission } from '@/lib/rbac';
import { ApiErrors } from '@/lib/api-error';
import { validateFileOrThrow, FILE_UPLOAD_CONFIGS } from '@/lib/file-upload-validator';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { monitoring } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

// Validation schema
const exampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

/**
 * GET - Example with permission check
 */
export const GET = withMiddleware(
  async (request: NextRequest) => {
    // Require permission to read resources
    const { error: permError, user } = await requirePermission(request, 'patients', 'read');
    if (permError) {
      throw ApiErrors.forbidden('You do not have permission to read this resource');
    }

    // Set user context for error tracking
    monitoring.setUser({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Add breadcrumb for debugging
    monitoring.addBreadcrumb(
      'User accessed protected resource',
      'api.access',
      'info',
      { endpoint: '/api/example-protected-route' }
    );

    return successResponse(
      {
        message: 'Success',
        data: { user: { id: user.id, name: user.name } },
      },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.API,
  }
);

/**
 * POST - Example with file upload validation
 */
export const POST = withMiddleware(
  async (request: NextRequest, data) => {
    // Require permission to write
    const { error: permError, user } = await requirePermission(request, 'patients', 'write');
    if (permError) {
      throw ApiErrors.forbidden('You do not have permission to create this resource');
    }

    // Handle file upload if present
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (file) {
      // Validate file using centralized validator
      try {
        validateFileOrThrow(file, FILE_UPLOAD_CONFIGS.PATIENT_REPORTS);
      } catch (error) {
        // Error is already an ApiError, just rethrow
        throw error;
      }
    }

    // Validate other data
    const validatedData = exampleSchema.parse({
      name: formData.get('name'),
      description: formData.get('description'),
    });

    // Process the request
    // ... your business logic here

    return successResponse(
      {
        message: 'Resource created successfully',
        data: validatedData,
      },
      201,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.UPLOAD,
    validateSchema: exampleSchema,
    validateSource: 'body',
  }
);

/**
 * DELETE - Example with role-based access
 */
export const DELETE = withMiddleware(
  async (request: NextRequest) => {
    // Require admin or doctor role
    const { error: roleError, user } = await requirePermission(request, 'patients', 'delete');
    if (roleError) {
      throw ApiErrors.forbidden('Only doctors and admins can delete resources');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw ApiErrors.badRequest('ID is required');
    }

    // Delete logic here
    // ...

    monitoring.addBreadcrumb(
      'Resource deleted',
      'api.delete',
      'info',
      { resourceId: id, userId: user.id }
    );

    return successResponse(
      {
        message: 'Resource deleted successfully',
      },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.STRICT,
  }
);




