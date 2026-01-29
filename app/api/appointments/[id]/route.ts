import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch single appointment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to fetch appointment:', error);
    return NextResponse.json(
      { message: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PUT - Update appointment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : undefined,
        appointmentTime: body.appointmentTime,
        duration: body.duration,
        appointmentType: body.appointmentType,
        status: body.status,
        reason: body.reason,
        notes: body.notes,
        reminderSent: body.reminderSent,
      },
      include: {
        patient: true,
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json(
      { message: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete appointment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete appointment:', error);
    return NextResponse.json(
      { message: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
