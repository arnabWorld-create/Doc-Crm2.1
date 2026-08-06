import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '@/lib/import-service';
import { requirePermission } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Parse uploaded file and return data preview.
 *
 * FIX #1: Changed from requireAuth (any logged-in user) to
 * requirePermission('patients', 'write') — only doctor/admin/staff
 * roles that are allowed to write patients can use import.
 *
 * FIX #3: Raw error messages are no longer sent to the client.
 * Internal details are logged server-side only.
 */
export async function POST(request: NextRequest) {
  const { error } = await requirePermission(request, 'patients', 'write');
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Only allow spreadsheet/CSV file types
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel',  // xls
      'text/csv',
      'text/plain',
    ];
    const ext = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['xlsx', 'xls', 'csv'];

    if (!allowedExtensions.includes(ext || '') && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const importService = new ImportService();
    const parsedData = await importService.parseFile(buffer, file.name);
    const suggestedMapping = importService.autoMapColumns(parsedData.columns);

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      rowCount: parsedData.rowCount,
      columns: parsedData.columns,
      suggestedMapping,
      preview: parsedData.data.slice(0, 10),
      fullData: parsedData.data,
    });
  } catch (error) {
    // FIX #3: Log full error server-side, send only a safe message to client
    logger.error('Import parse failed', error);
    return NextResponse.json(
      { error: 'Failed to parse file. Please check the file format and try again.' },
      { status: 500 }
    );
  }
}
