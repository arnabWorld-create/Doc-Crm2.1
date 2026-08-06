import prisma from './prisma';

// Generate the next patient ID (FC-001, FC-002, ..., FC-1000, etc.).
// Uses a PostgreSQL sequence for O(1) atomic generation instead of O(n) fetch-all.
export async function generatePatientId(): Promise<string> {
  const result = await prisma.$queryRawUnsafe(`SELECT nextval('patient_id_seq') AS nextval`);
  const nextVal = result[0].nextval;
  return `FC-${String(nextVal).padStart(3, '0')}`;
}

// Format patient ID for display
export function formatPatientId(id: string): string {
  return id; // Already formatted as FC-XXX
}

// Search patients by name, contact, or patient ID
// Uses PostgreSQL full-text search for better performance at scale
export async function searchPatients(query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.trim();

  // Use full-text search if available (PostgreSQL with search_vector column)
  // Falls back to LIKE search if full-text search is not available
  try {
    // Prepare search query for PostgreSQL full-text search
    // Replace spaces with & for AND search, escape special characters
    const tsQuery = searchTerm
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(term => term.length > 0)
      .join(' & ');

    if (!tsQuery) {
      return [];
    }

    // Use raw SQL for full-text search with ranking
    const patients = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p."patientId",
        p.name,
        p.age,
        p.gender,
        p.contact,
        p.address,
        p."bloodGroup",
        p.allergies,
        p."chronicConditions",
        p."createdAt",
        p."updatedAt",
        ts_rank(p.search_vector, to_tsquery('english', ${tsQuery})) as rank
      FROM patients p
      WHERE p.search_vector @@ to_tsquery('english', ${tsQuery})
      ORDER BY rank DESC, p."updatedAt" DESC
      LIMIT 50
    `;

    // Fetch last visit for each patient
    const patientsWithVisits = await Promise.all(
      patients.map(async (patient) => {
        const lastVisit = await prisma.visit.findFirst({
          where: { patientId: patient.id },
          orderBy: { visitDate: 'desc' },
        });

        return {
          ...patient,
          visits: lastVisit ? [lastVisit] : [],
        };
      })
    );

    return patientsWithVisits;
  } catch (error) {
    // Fallback to LIKE search if full-text search fails
    console.warn('Full-text search failed, falling back to LIKE search:', error);
    
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
          take: 1,
        },
      },
      take: 50,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
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
