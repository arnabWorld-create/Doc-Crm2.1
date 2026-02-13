import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// GET - Fetch clinic profile
export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'settings', 'read');
  if (error) return error;

  try {
    let profile = await prisma.clinicProfile.findFirst();

    // If no profile exists, create default one
    if (!profile) {
      profile = await prisma.clinicProfile.create({
        data: {
          clinicName: 'DoXcia',
          workingHours: 'Mon-Sat: 9:00 AM - 8:00 PM | Sun: 10:00 AM - 2:00 PM',
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to fetch clinic profile:', error);
    return NextResponse.json(
      { message: 'Failed to fetch clinic profile' },
      { status: 500 }
    );
  }
}

// PUT - Update clinic profile
export async function PUT(req: NextRequest) {
  const { error } = await requirePermission(req, 'settings', 'write');
  if (error) return error;

  try {
    const body = await req.json();

    // Get existing profile or create new one
    let profile = await prisma.clinicProfile.findFirst();

    if (profile) {
      // Update existing
      profile = await prisma.clinicProfile.update({
        where: { id: profile.id },
        data: {
          clinicName: body.clinicName,
          address: body.address,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          phone: body.phone,
          email: body.email,
          website: body.website,
          workingHours: body.workingHours,
          doctorName: body.doctorName,
          doctorQualification: body.doctorQualification,
          registrationNumber: body.registrationNumber,
          specialization: body.specialization,
          tagline: body.tagline,
        },
      });
    } else {
      // Create new
      profile = await prisma.clinicProfile.create({
        data: body,
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to update clinic profile:', error);
    return NextResponse.json(
      { message: 'Failed to update clinic profile' },
      { status: 500 }
    );
  }
}
