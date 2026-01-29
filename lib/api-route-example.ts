/**
 * Example of how to use the new middleware in API routes
 * Copy this pattern to your API routes
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMiddleware, successResponse } from './middleware';
import { RATE_LIMITS } from './rate-limiter';

// Define validation schema
const exampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(0).max(150).optional(),
});

// Example API route handler
export const POST = withMiddleware(
  async (request, data) => {
    // data is already validated against exampleSchema
    console.log('Validated data:', data);

    // Your business logic here
    const result = {
      success: true,
      data: data,
    };

    return successResponse(result, 201, request);
  },
  {
    rateLimit: RATE_LIMITS.API,
    validateSchema: exampleSchema,
    validateSource: 'body',
  }
);

/**
 * USAGE IN YOUR API ROUTES:
 *
 * 1. Basic usage with validation:
 *    export const POST = withMiddleware(
 *      async (request, data) => {
 *        // data is validated
 *        return successResponse({ success: true }, 200, request);
 *      },
 *      {
 *        validateSchema: yourSchema,
 *      }
 *    );
 *
 * 2. With rate limiting:
 *    export const GET = withMiddleware(
 *      async (request) => {
 *        return successResponse({ data: [] }, 200, request);
 *      },
 *      {
 *        rateLimit: RATE_LIMITS.STRICT,
 *      }
 *    );
 *
 * 3. With query validation:
 *    export const GET = withMiddleware(
 *      async (request, data) => {
 *        // data contains validated query params
 *        return successResponse({ data }, 200, request);
 *      },
 *      {
 *        validateSchema: querySchema,
 *        validateSource: 'query',
 *      }
 *    );
 *
 * 4. Full example with auth check:
 *    export const DELETE = withMiddleware(
 *      async (request, data) => {
 *        // Check authentication
 *        const token = request.headers.get('authorization');
 *        if (!token) {
 *          throw ApiErrors.unauthorized();
 *        }
 *
 *        // Your logic
 *        return successResponse({ deleted: true }, 200, request);
 *      },
 *      {
 *        rateLimit: RATE_LIMITS.STRICT,
 *        validateSchema: deleteSchema,
 *      }
 *    );
 */
