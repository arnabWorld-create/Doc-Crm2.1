import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { withMiddleware, successResponse } from '@/lib/middleware';
import { ApiErrors } from '@/lib/api-error';
import { validateFileOrThrow, FILE_UPLOAD_CONFIGS, generateSafeFilename } from '@/lib/file-upload-validator';
import { RATE_LIMITS } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

// FIX: Logo uploads now go to Supabase Storage instead of /public/uploads/.
//
// The previous implementation:
//   1. Wrote files to the local filesystem — wiped on every Vercel deployment
//   2. Served all uploads publicly without authentication via the /public directory
//   3. Only validated file.type (client-supplied, easily spoofed)
//
// This implementation uploads to the 'clinic-assets' Supabase Storage bucket.
// The bucket should be set to public so the returned URL is directly usable in <img>.
// If you need private logos, use a signed URL instead of getPublicUrl().

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw ApiErrors.internalError(
      'Supabase storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  // Use the service-role key on the server so we can write to storage
  // regardless of bucket RLS policies.
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export const POST = withMiddleware(
  async (request: NextRequest) => {
    const { error: permError } = await requirePermission(request, 'settings', 'write');
    if (permError) throw ApiErrors.forbidden('Insufficient permissions to upload logo');

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      throw ApiErrors.badRequest('No file uploaded');
    }

    // Validate file size, MIME type, and extension
    validateFileOrThrow(file, FILE_UPLOAD_CONFIGS.CLINIC_LOGO);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Additional magic-byte check for common image formats
    // to guard against spoofed file.type values
    validateImageMagicBytes(buffer, file.name);

    const supabase = getSupabaseAdminClient();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'clinic-assets';
    const filename = generateSafeFilename(file.name, 'logo');
    const storagePath = `logos/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw ApiErrors.internalError(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    const logoPath = publicUrlData.publicUrl;

    // Update or create the clinic profile with the new logo URL
    const profile = await prisma.clinicProfile.findFirst();

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
      { message: 'Logo uploaded successfully', logoPath },
      200,
      request
    );
  },
  {
    rateLimit: RATE_LIMITS.UPLOAD,
  }
);

/**
 * Validate image magic bytes (file signature) to catch files with spoofed MIME types.
 * Supports JPEG, PNG, GIF, WebP, and SVG.
 */
function validateImageMagicBytes(buffer: Buffer, filename: string): void {
  const ext = filename.toLowerCase().split('.').pop();

  // SVG is text-based — skip binary check but verify it looks like XML/SVG
  if (ext === 'svg') {
    const text = buffer.slice(0, 256).toString('utf8');
    if (!text.includes('<svg') && !text.includes('<?xml')) {
      throw ApiErrors.badRequest('File does not appear to be a valid SVG');
    }
    return;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return;
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return;
  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return;

  throw ApiErrors.badRequest(
    'File content does not match an allowed image format (JPEG, PNG, GIF, WebP, SVG)'
  );
}
