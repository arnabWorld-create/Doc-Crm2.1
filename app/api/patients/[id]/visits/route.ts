import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Add new visit to existing patient
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();


    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!patient) {
      console.error('Patient not found:', params.id);
      return NextResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      );
    }



    // Prepare visit data with careful type conversion
    const visitData: any = {
      patientId: params.id,
      visitDate: body.visitDate ? new Date(body.visitDate) : new Date(),
      visitType: body.visitType || 'Consultation',
    };

    // Add optional string fields only if they have values
    if (body.chiefComplaint) visitData.chiefComplaint = body.chiefComplaint;
    if (body.signs) visitData.signs = body.signs;
    if (body.investigations) visitData.investigations = body.investigations;
    if (body.diagnosis) visitData.diagnosis = body.diagnosis;
    if (body.treatment) visitData.treatment = body.treatment;
    if (body.medicines) visitData.medicines = body.medicines;
    if (body.notes) visitData.notes = body.notes;
    if (body.bloodPressure) visitData.bloodPressure = body.bloodPressure;
    if (body.referredTo) visitData.referredTo = body.referredTo;
    if (body.followUpNotes) visitData.followUpNotes = body.followUpNotes;
    if (body.paidBy) visitData.paidBy = body.paidBy;

    // Add new vital fields - parse from bloodPressure string if not provided separately
    let bpSystolic = body.bpSystolic;
    let bpDiastolic = body.bpDiastolic;
    
    // If bloodPressure string is provided, parse it
    if (body.bloodPressure && !bpSystolic && !bpDiastolic) {
      const bpParts = body.bloodPressure.split('/');
      if (bpParts.length === 2) {
        bpSystolic = bpParts[0].trim();
        bpDiastolic = bpParts[1].trim();
      }
    }
    
    if (bpSystolic && bpSystolic !== '') {
      const bpSystolicNum = parseInt(bpSystolic);
      if (!isNaN(bpSystolicNum)) visitData.bpSystolic = bpSystolicNum;
    }
    if (bpDiastolic && bpDiastolic !== '') {
      const bpDiastolicNum = parseInt(bpDiastolic);
      if (!isNaN(bpDiastolicNum)) visitData.bpDiastolic = bpDiastolicNum;
    }
    if (body.rbs && body.rbs !== '') {
      const rbsNum = parseInt(body.rbs);
      if (!isNaN(rbsNum)) visitData.rbs = rbsNum;
    }

    // Handle reports - convert array to JSON string or null
    if (body.reports && Array.isArray(body.reports) && body.reports.length > 0) {
      visitData.reports = JSON.stringify(body.reports);
    }

    // Add numeric fields with validation
    if (body.temp && body.temp !== '') {
      const tempNum = parseFloat(body.temp);
      if (!isNaN(tempNum)) visitData.temp = tempNum;
    }
    if (body.spo2 && body.spo2 !== '') {
      const spo2Num = parseInt(body.spo2);
      if (!isNaN(spo2Num)) visitData.spo2 = spo2Num;
    }
    if (body.pulse && body.pulse !== '') {
      const pulseNum = parseInt(body.pulse);
      if (!isNaN(pulseNum)) visitData.pulse = pulseNum;
    }
    if (body.weight && body.weight !== '') {
      const weightNum = parseFloat(body.weight);
      if (!isNaN(weightNum)) visitData.weight = weightNum;
    }

    // Add date fields
    if (body.followUpDate && body.followUpDate !== '') {
      visitData.followUpDate = new Date(body.followUpDate);
    }



    // Create visit with medications in a transaction
    const visit = await prisma.$transaction(async (tx) => {
      // Create the visit
      const newVisit = await tx.visit.create({
        data: visitData,
      });

      // Create medications if provided
      if (body.medications && Array.isArray(body.medications)) {
        const medicationsToCreate = body.medications
          .filter((med: any) => med.name && med.name.trim())
          .map((med: any) => ({
            visitId: newVisit.id,
            medicine: med.name.trim(),
            dose: med.dose || null,
            frequency: med.frequency || null,
            timing: med.timing || null,
            duration: med.duration || null,
            startFrom: med.startFrom || null,
            instructions: med.instructions || null,
          }));

        if (medicationsToCreate.length > 0) {
          await tx.medication.createMany({
            data: medicationsToCreate,
          });
        }
      }

      // Return visit with medications
      return tx.visit.findUnique({
        where: { id: newVisit.id },
        include: { medications: true },
      });
    });


    return NextResponse.json(visit, { status: 201 });
  } catch (error: any) {
    console.error('❌ Failed to create visit - Full error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { message: 'Failed to create visit', error: error.message || String(error) },
      { status: 500 }
    );
  }
}
