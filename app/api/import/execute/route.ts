import { NextRequest } from 'next/server';
import { ImportService } from '@/lib/import-service';
import { requireAuth } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Execute import with progress streaming
 */
export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  
  try {
    const body = await request.json();
    const { data, mapping } = body;
    
    if (!data || !Array.isArray(data)) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create readable stream for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const importService = new ImportService();
        const startTime = Date.now();
        
        let successCount = 0;
        let failedCount = 0;
        let patientsCreated = 0;
        let visitsCreated = 0;
        const errors: Array<{ row: number; error: string }> = [];
        
        const batchSize = 100;
        const totalBatches = Math.ceil(data.length / batchSize);
        
        try {
          for (let i = 0; i < totalBatches; i++) {
            const batch = data.slice(i * batchSize, (i + 1) * batchSize);
            
            // Process batch
            for (const row of batch) {
              const rowIndex = data.indexOf(row);
              
              try {
                // Map row to patient and visit data
                const { patient: patientData, visit: visitData } = importService.mapRowToPatientAndVisit(row, mapping);
                
                // Skip if name is empty
                if (!patientData.name) {
                  failedCount++;
                  errors.push({
                    row: rowIndex + 2,
                    error: 'Name is required',
                  });
                  continue;
                }
                
                // Create patient with visit if present
                const patient = await prisma.patient.create({
                  data: patientData,
                });
                
                patientsCreated++;
                
                // Create visit if visit data exists
                if (visitData) {
                  await prisma.visit.create({
                    data: {
                      ...visitData,
                      patientId: patient.id,
                    },
                  });
                  visitsCreated++;
                }
                
                successCount++;
              } catch (err) {
                failedCount++;
                errors.push({
                  row: rowIndex + 2,
                  error: (err as Error).message,
                });
              }
            }
            
            // Send progress update
            const progress = ((i + 1) / totalBatches) * 100;
            const message = `data: ${JSON.stringify({ 
              progress: Math.round(progress),
              success: successCount,
              failed: failedCount,
            })}\n\n`;
            
            controller.enqueue(encoder.encode(message));
          }
          
          // Send final result
          const duration = Math.round((Date.now() - startTime) / 1000);
          const result = {
            success: successCount,
            failed: failedCount,
            errors: errors.slice(0, 100), // Limit to first 100 errors
            duration,
            patientsCreated,
            visitsCreated,
          };
          
          const finalMessage = `data: ${JSON.stringify({ result })}\n\n`;
          controller.enqueue(encoder.encode(finalMessage));
          
          controller.close();
        } catch (err) {
          const errorMessage = `data: ${JSON.stringify({ 
            error: (err as Error).message 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
        }
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
