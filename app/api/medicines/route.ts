import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch all custom medicines
export async function GET() {
  try {
    const customMedicines = await prisma.customMedicine.findMany({
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(customMedicines);
  } catch (error) {
    console.error('Failed to fetch custom medicines:', error);
    return NextResponse.json(
      { message: 'Failed to fetch medicines' },
      { status: 500 }
    );
  }
}

// POST - Add or update custom medicine
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { message: 'Medicine name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Validate minimum length (prevent incomplete entries like "be", "bec", "beco")
    if (trimmedName.length < 4) {
      return NextResponse.json(
        { message: 'Medicine name must be at least 4 characters' },
        { status: 400 }
      );
    }

    // Check if medicine already exists
    const existing = await prisma.customMedicine.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      // Increment usage count
      const updated = await prisma.customMedicine.update({
        where: { name: trimmedName },
        data: { usageCount: existing.usageCount + 1 },
      });
      return NextResponse.json(updated);
    } else {
      // Create new medicine
      const newMedicine = await prisma.customMedicine.create({
        data: { name: trimmedName },
      });
      return NextResponse.json(newMedicine, { status: 201 });
    }
  } catch (error) {
    console.error('Failed to save custom medicine:', error);
    return NextResponse.json(
      { message: 'Failed to save medicine' },
      { status: 500 }
    );
  }
}
