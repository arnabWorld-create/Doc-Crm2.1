import { NextRequest } from 'next/server';
import { ImportService } from '@/lib/import-service';
import { requireAuth } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for imports

// Track active imports per user to prevent concurrent imports
const activeImports = new Map<string, boolean>();

/**
 * Execute import with progress streaming
 */
export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  
  const userId = user.userId;
  
  // Check for concurrent imports (prevent multiple imports at once)
  if (activeImports.get(userId)) {
    return new Response(
      JSON.stringify({ error: 'An import is already in progress. Please wait for it to complete.' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    const body = await request.json();
    const { data, mapping, duplicateStrategy = 'skip' } = body;
    
    if (!data || !Array.isArray(data)) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Limit data size (Issue 3 - Memory protection)
    if (data.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Too many rows. Maximum 5000 records per import.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Mark import as active
    activeImports.set(userId, true);
    
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
        let duplicatesSkipped = 0;
        let duplicatesUpdated = 0;
        const errors: Array<{ row: number; error: string }> = [];
        
        const batchSize = 50; // Reduced batch size for better memory management
        const totalBatches = Math.ceil(data.length / batchSize);
        
        try {
          for (let i = 0; i < totalBatches; i++) {
            const batch = data.slice(i * batchSize, (i + 1) * batchSize);
            
            // Process batch in transaction (Issue 2)
            try {
              await prisma.$transaction(async (tx) => {
                for (const row of batch) {
                  const rowIndex = data.indexOf(row);
                  
                  try {
                    // Map row to patient and visit data
                    const { patient: patientData, visit: visitData } = await importService.mapRowToPatientAndVisit(row, mapping);
                    
                    // Skip if name is empty
                    if (!patientData.name) {
                      failedCount++;
                      errors.push({
                        row: rowIndex + 2,
                        error: 'Patient name is required',
                      });
                      continue;
                    }
                    
                    // Check for duplicates (Issue 1)
                    const duplicateCheck = await importService.checkDuplicate(patientData, tx);
                    
                    let patient;
                    if (duplicateCheck.isDuplicate && duplicateStrategy !== 'create') {
                      // Only handle duplicates if strategy is NOT 'create'
                      if (duplicateStrategy === 'skip') {
                        duplicatesSkipped++;
                        successCount++;
                        continue;
                      } else if (duplicateStrategy === 'update') {
                        // Update existing patient
                        patient = await tx.patient.update({
                          where: { id: duplicateCheck.existingPatient.id },
                          data: {
                            age: patientData.age || duplicateCheck.existingPatient.age,
                            gender: patientData.gender || duplicateCheck.existingPatient.gender,
                            bloodGroup: patientData.bloodGroup || duplicateCheck.existingPatient.bloodGroup,
                            address: patientData.address || duplicateCheck.existingPatient.address,
                            allergies: patientData.allergies || duplicateCheck.existingPatient.allergies,
                            chronicConditions: patientData.chronicConditions || duplicateCheck.existingPatient.chronicConditions,
                          },
                        });
                        duplicatesUpdated++;
                      }
                    } else {
                      // Create new patient (either no duplicate OR strategy is 'create')
                      // For 'create' strategy, always generate a new unique ID
                      if (duplicateStrategy === 'create' || duplicateCheck.isDuplicate) {
                        patientData.patientId = await importService.generateUniquePatientId(tx);
                      }
                      
                      // Retry logic for duplicate patient IDs
                      let retries = 0;
                      const maxRetries = 5;
                      while (retries < maxRetries) {
                        try {
                          patient = await tx.patient.create({
                            data: patientData,
                          });
                          patientsCreated++;
                          break; // Success, exit retry loop
                        } catch (createError: any) {
                          if (createError.code === 'P2002' && retries < maxRetries - 1) {
                            // Unique constraint violation, generate new ID and retry
                            retries++;
                            patientData.patientId = await importService.generateUniquePatientId(tx);
                            console.log(`Retry ${retries}: Generated new patient ID ${patientData.patientId}`);
                            continue;
                          }
                          throw createError; // Re-throw if not duplicate or max retries reached
                        }
                      }
                    }
                    
                    // Create visit if visit data exists
                    if (visitData && patient) {
                      await tx.visit.create({
                        data: {
                          ...visitData,
                          patientId: patient.id,
                        },
                      });
                      visitsCreated++;
                    }
                    
                    successCount++;
                  } catch (err: any) {
                    failedCount++;
                    // Better error messages (Issue 5)
                    let errorMessage = err.message || 'Unknown error';
                    
                    // Log detailed error for debugging
                    console.error(`Row ${rowIndex + 2} error:`, {
                      message: err.message,
                      code: err.code,
                      meta: err.meta,
                    });
                    
                    // User-friendly error messages
                    if (err.code === 'P2002') {
                      const target = err.meta?.target || [];
                      if (target.includes('patientId')) {
                        errorMessage = `Duplicate patient ID`;
                      } else if (target.includes('contact')) {
                        errorMessage = `Duplicate contact number`;
                      } else {
                        errorMessage = 'Duplicate record detected';
                      }
                    } else if (err.code === 'P2003') {
                      errorMessage = 'Invalid reference data';
                    } else if (errorMessage.includes('Unique constraint')) {
                      errorMessage = 'Duplicate patient ID detected';
                    } else if (errorMessage.includes('Foreign key constraint')) {
                      errorMessage = 'Invalid reference data';
                    } else if (errorMessage.includes('Invalid')) {
                      errorMessage = `Invalid data: ${errorMessage}`;
                    }
                    
                    errors.push({
                      row: rowIndex + 2,
                      error: errorMessage,
                    });
                  }
                }
              }, {
                timeout: 30000, // 30 second timeout per batch
              });
            } catch (batchError) {
              // If batch fails, log it but continue with next batch
              console.error(`Batch ${i + 1} failed:`, batchError);
              failedCount += batch.length;
              errors.push({
                row: i * batchSize + 2,
                error: `Batch processing failed: ${(batchError as Error).message}`,
              });
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
            duplicatesSkipped,
            duplicatesUpdated,
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
        } finally {
          // Release import lock
          activeImports.delete(userId);
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
    activeImports.delete(userId);
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
