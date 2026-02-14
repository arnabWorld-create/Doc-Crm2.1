import { NextRequest, NextResponse } from 'next/server';
import { ExportService } from '@/lib/export-service';
import { requireAuth } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Export patient data
 * GET /api/export?format=excel|json|csv
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { error, user } = await requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';
    const includeVisits = searchParams.get('includeVisits') !== 'false';
    const includeAppointments = searchParams.get('includeAppointments') !== 'false';
    
    const exportService = new ExportService();
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    logger.info('Exporting data', {
      userId: user.userId,
      format,
      includeVisits,
      includeAppointments,
    });
    
    switch (format) {
      case 'excel': {
        const buffer = await exportService.exportToExcel({
          includeVisits,
          includeAppointments,
        });
        
        return new Response(buffer as any, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="doxcia-export-${timestamp}.xlsx"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      }
      
      case 'json': {
        const data = await exportService.exportToJSON({
          includeVisits,
          includeAppointments,
        });
        
        const jsonString = JSON.stringify(data, null, 2);
        
        return new Response(jsonString, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="doxcia-backup-${timestamp}.json"`,
          },
        });
      }
      
      case 'csv': {
        const csvFiles = await exportService.exportToCSV({
          includeVisits,
          includeAppointments,
        });
        
        // For CSV, we'll return a ZIP file with multiple CSVs
        // For now, return just the patients CSV
        // TODO: Implement ZIP creation for multiple CSV files
        const patientsCSV = csvFiles['patients.csv'];
        
        return new Response(patientsCSV, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="doxcia-patients-${timestamp}.csv"`,
          },
        });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid format. Use: excel, json, or csv' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Export failed', error);
    return NextResponse.json(
      { error: 'Export failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
