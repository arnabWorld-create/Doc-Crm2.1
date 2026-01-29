import prisma from './prisma';

// Generate next patient ID (FC-001, FC-002, etc.)
export async function generatePatientId(): Promise<string> {
  const lastPatient = await prisma.patient.findFirst({
    orderBy: {
      patientId: 'desc',
    },
    select: {
      patientId: true,
    },
  });

  if (!lastPatient) {
    return 'FC-001';
  }

  // Extract number from FC-XXX
  const lastNumber = parseInt(lastPatient.patientId.split('-')[1]);
  const nextNumber = lastNumber + 1;
  
  // Pad with zeros (FC-001, FC-002, ..., FC-999)
  return `FC-${String(nextNumber).padStart(3, '0')}`;
}

// Format patient ID for display
export function formatPatientId(id: string): string {
  return id; // Already formatted as FC-XXX
}

// Search patients by name, contact, or patient ID
export async function searchPatients(query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.trim();

  return await prisma.patient.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { contact: { contains: searchTerm } },
        { patientId: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    include: {
      visits: {
        orderBy: {
          visitDate: 'desc',
        },
        take: 1, // Get last visit for display
      },
    },
    take: 10, // Limit results
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

// Get recent patients (last 30 days)
export async function getRecentPatients(limit: number = 10) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await prisma.patient.findMany({
    where: {
      visits: {
        some: {
          visitDate: {
            gte: thirtyDaysAgo,
          },
        },
      },
    },
    include: {
      visits: {
        orderBy: {
          visitDate: 'desc',
        },
        take: 1,
      },
    },
    take: limit,
    orderBy: {
      updatedAt: 'desc',
    },
  });
}
