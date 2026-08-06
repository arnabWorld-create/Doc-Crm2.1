import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '@/lib/import-service';
import { requirePermission } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Validate import data before executing.
 *
 * FIX #1: Changed from requireAuth to requirePermission('patients', 'write').
 * FIX #3: Raw error messages no longer sent to client.
 */
export async function POST(request: NextRequest) {
  const { error } = await requirePermission(request, 'patients', 'write');
  if (error) return error;

  try {
    const body = await request.json();
    const { data, mapping } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    if (!mapping || typeof mapping !== 'object') {
      return NextResponse.json({ error: 'Invalid mapping format' }, { status: 400 });
    }

    const importService = new ImportService();
    const validation = importService.validateData(data, mapping);

    return NextResponse.json(validation);
  } catch (error) {
    // FIX #3: Log full error server-side, send only a safe message to client
    logger.error('Import validation failed', error);
    return NextResponse.json(
      { error: 'Validation failed. Please check your data and try again.' },
      { status: 500 }
    );
  }
}
