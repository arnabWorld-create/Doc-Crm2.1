import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { validateFileOrThrow, FILE_UPLOAD_CONFIGS, generateSafeFilename } from '@/lib/file-upload-validator';
import { RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export const POST = withMiddleware(
  async (request: NextRequest) => {
    // Require authentication and permission
    const { error: permError, user } = await requirePermission(request, 'settings', 'write');
    if (permError) throw ApiErrors.forbidden('Insufficient permissions to upload logo');

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      throw ApiErrors.badRequest('No file uploaded');
    }

    // Validate file using centralized validator
    validateFileOrThrow(file, FILE_UPLOAD_CONFIGS.CLINIC_LOGO);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate safe filename
    const filename = generateSafeFilename(file.name, 'logo');
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Update clinic profile with logo path
    const logoPath = `/uploads/${filename}`;
    let profile = await prisma.clinicProfile.findFirst();

    if (profile) {
      await prisma.clinicProfile.update({
        where: { id: profile.id },
        data: { logo: logoPath },
      });
    } else {
      await prisma.clinicProfile.create({
        data: {
          clinicName: 'DoXcia',
          logo: logoPath,
        },
      });
    }

    return successResponse(
      {
        message: 'Logo uploaded successfully',
        logoPath,
      },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.UPLOAD,
  }
);
