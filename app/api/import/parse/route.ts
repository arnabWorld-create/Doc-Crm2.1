import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '@/lib/import-service';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * Parse uploaded file and return data preview
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }
    
    // Parse file
    const buffer = await file.arrayBuffer();
    const importService = new ImportService();
    const parsedData = await importService.parseFile(buffer, file.name);
    
    // Auto-detect column mapping
    const suggestedMapping = importService.autoMapColumns(parsedData.columns);
    
    // Return preview (first 10 rows)
    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      rowCount: parsedData.rowCount,
      columns: parsedData.columns,
      suggestedMapping,
      preview: parsedData.data.slice(0, 10),
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
