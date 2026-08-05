import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    logger.info('Diagnostic check requested');

    return NextResponse.json({
      success: true,
      message: 'Diagnostic check completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error('Diagnostic error', error);
    const { sanitizeErrorForClient } = await import('@/lib/sanitize-error');
    return NextResponse.json(
      { success: false, error: sanitizeErrorForClient(error) },
      { status: 500 }
    );
  }
}