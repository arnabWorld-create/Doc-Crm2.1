import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET single patient with paginated visit history
// Query params: ?visitPage=1&visitLimit=20
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(req, 'patients', 'read');
  if (error) return error;

  try {
    // FIX: Added pagination for visit history to prevent returning unbounded
    // result sets for patients with many visits.
    const { searchParams } = new URL(req.url);
    const visitPage = Math.max(1, parseInt(searchParams.get('visitPage') || '1'));
    const visitLimit = Math.min(100, Math.max(1, parseInt(searchParams.get('visitLimit') || '20')));
    const visitSkip = (visitPage - 1) * visitLimit;

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!patient) {
      return NextResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Fetch visits and total count in parallel
    const [visits, totalVisits] = await Promise.all([
      prisma.visit.findMany({
        where: { patientId: params.id },
        orderBy: { visitDate: 'desc' },
        skip: visitSkip,
        take: visitLimit,
        include: { medications: true, fees: true },
      }),
      prisma.visit.count({ where: { patientId: params.id } }),
    ]);

    return NextResponse.json({
      ...patient,
      visits,
      visitPagination: {
        total: totalVisits,
        page: visitPage,
        limit: visitLimit,
        pages: Math.ceil(totalVisits / visitLimit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch patient', error);
    return NextResponse.json({ message: 'Failed to fetch patient' }, { status: 500 });
  }
}

// PUT - Update patient basic info and first visit vitals
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(req, 'patients', 'write');
  if (error) return error;

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
          take: 20, // cap response size — caller can paginate for full history
          include: { medications: true },
        },
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    logger.error('Failed to update patient', error);
    return NextResponse.json({ message: 'Failed to update patient' }, { status: 500 });
  }
}

// DELETE patient
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(req, 'patients', 'delete');
  if (error) return error;

  try {
    await prisma.patient.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete patient', error);
    return NextResponse.json({ message: 'Failed to delete patient' }, { status: 500 });
  }
}
