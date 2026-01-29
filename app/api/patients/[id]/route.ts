import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET single patient with all visits
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify authentication
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
          include: { medications: true },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Failed to fetch patient:', error);
    return NextResponse.json(
      { message: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PUT - Update patient basic info and first visit vitals
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    
    const { name, age, gender, contact, address, bloodGroup, allergies, chronicConditions, ...visitData } = body;

    // Get the patient's first visit
    const existingPatient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        visits: {
          orderBy: { visitDate: 'asc' },
          take: 1,
        },
      },
    });

    // Prepare visit update data if vitals are provided
    const visitUpdateData: any = {};
    
    if (visitData.temp !== undefined) visitUpdateData.temp = visitData.temp ? parseFloat(visitData.temp) : null;
    if (visitData.spo2 !== undefined) visitUpdateData.spo2 = visitData.spo2 ? parseInt(visitData.spo2) : null;
    if (visitData.pulse !== undefined) visitUpdateData.pulse = visitData.pulse ? parseInt(visitData.pulse) : null;
    if (visitData.bloodPressure !== undefined) visitUpdateData.bloodPressure = visitData.bloodPressure || null;
    if (visitData.bpSystolic !== undefined) visitUpdateData.bpSystolic = visitData.bpSystolic ? parseInt(visitData.bpSystolic) : null;
    if (visitData.bpDiastolic !== undefined) visitUpdateData.bpDiastolic = visitData.bpDiastolic ? parseInt(visitData.bpDiastolic) : null;
    if (visitData.rbs !== undefined) visitUpdateData.rbs = visitData.rbs ? parseInt(visitData.rbs) : null;
    if (visitData.weight !== undefined) visitUpdateData.weight = visitData.weight ? parseFloat(visitData.weight) : null;
    if (visitData.chiefComplaint !== undefined) visitUpdateData.chiefComplaint = visitData.chiefComplaint || null;
    if (visitData.signs !== undefined) visitUpdateData.signs = visitData.signs || null;
    if (visitData.investigations !== undefined) visitUpdateData.investigations = visitData.investigations || null;
    if (visitData.diagnosis !== undefined) visitUpdateData.diagnosis = visitData.diagnosis || null;
    if (visitData.treatment !== undefined) visitUpdateData.treatment = visitData.treatment || null;
    if (visitData.consultationDate !== undefined) visitUpdateData.visitDate = visitData.consultationDate ? new Date(visitData.consultationDate) : undefined;
    if (visitData.followUpDate !== undefined) visitUpdateData.followUpDate = visitData.followUpDate ? new Date(visitData.followUpDate) : null;
    if (visitData.followUpNotes !== undefined) visitUpdateData.followUpNotes = visitData.followUpNotes || null;
    if (visitData.referredTo !== undefined) visitUpdateData.referredTo = visitData.referredTo || null;

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        name,
        age: age ? parseInt(age) : null,
        gender,
        contact,
        address,
        bloodGroup,
        allergies,
        chronicConditions,
        // Update first visit if it exists
        ...(existingPatient?.visits && existingPatient.visits.length > 0 && Object.keys(visitUpdateData).length > 0 ? {
          visits: {
            update: {
              where: { id: existingPatient.visits[0].id },
              data: visitUpdateData,
            },
          },
        } : {}),
      },
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
          include: { medications: true },
        },
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Failed to update patient:', error);
    return NextResponse.json(
      { message: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

// DELETE patient
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.patient.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Failed to delete patient:', error);
    return NextResponse.json(
      { message: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
