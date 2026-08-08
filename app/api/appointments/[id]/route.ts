import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const updateAppointmentSchema = z.object({
  appointmentDate:  z.string().datetime().optional(),
  appointmentTime:  z.string().max(20).optional(),
  duration:         z.number().int().min(5).max(480).optional(),
  appointmentType:  z.string().max(100).optional(),
  status:           z.enum(['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show']).optional(),
  reason:           z.string().max(1000).optional().nullable(),
  notes:            z.string().max(2000).optional().nullable(),
  reminderSent:     z.boolean().optional(),
});

// GET - Fetch single appointment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(req, 'appointments', 'read');
  if (error) return error;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { patient: true },
    });

    if (!appointment) {
      return NextResponse.json({ message: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    logger.error('Failed to fetch appointment', error);
    return NextResponse.json({ message: 'Failed to fetch appointment' }, { status: 500 });
  }
}

// PUT - Update appointment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(req, 'appointments', 'write');
  if (error) return error;

  try {
    const rawBody = await req.json();
    const parsed = updateAppointmentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const body = parsed.data;

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        appointmentDate:  body.appointmentDate ? new Date(body.appointmentDate) : undefined,
        appointmentTime:  body.appointmentTime,
        duration:         body.duration,
        appointmentType:  body.appointmentType,
        status:           body.status,
        reason:           body.reason,
        notes:            body.notes,
        reminderSent:     body.reminderSent,
      },
      include: { patient: true },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    logger.error('Failed to update appointment', error);
    return NextResponse.json({ message: 'Failed to update appointment' }, { status: 500 });
  }
}

// DELETE - Delete appointment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requirePermission(req, 'appointments', 'delete');
  if (error) return error;

  try {
    await prisma.appointment.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete appointment', error);
    return NextResponse.json({ message: 'Failed to delete appointment' }, { status: 500 });
  }
}
