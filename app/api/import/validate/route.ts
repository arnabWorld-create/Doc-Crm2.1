import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '@/lib/import-service';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * Validate data before import
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;
  
  try {
    const body = await request.json();
    const { data, mapping } = body;
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }
    
    if (!mapping || typeof mapping !== 'object') {
      return NextResponse.json(
        { error: 'Invalid mapping format' },
        { status: 400 }
      );
    }
    
    // Validate data
    const importService = new ImportService();
    const validation = importService.validateData(data, mapping);
    
    return NextResponse.json(validation);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
