import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { calculatePatientAnalytics } from '@/lib/analytics-calculator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Timing-safe string comparison to prevent timing attacks on secret comparison.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    // Buffers must be the same length for timingSafeEqual
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Vercel Cron Job endpoint
// This endpoint is called by Vercel Cron every 6 hours to pre-calculate analytics
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');

    if (!process.env.CRON_SECRET) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    // FIX: Use timing-safe comparison to prevent timing-based secret enumeration attacks
    if (!authHeader || !timingSafeStringEqual(authHeader, expectedAuth)) {
      logger.warn('Unauthorized cron request', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Calculate analytics
    const result = await calculatePatientAnalytics();
    
    logger.info('Cron job completed successfully', result);
    
    return NextResponse.json({ 
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed', error);
    return NextResponse.json({ 
      error: 'Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
