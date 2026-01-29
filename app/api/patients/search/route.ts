import { NextRequest, NextResponse } from 'next/server';
import { searchPatients } from '@/lib/patientUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const patients = await searchPatients(query);

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { message: 'Search failed' },
      { status: 500 }
    );
  }
}
