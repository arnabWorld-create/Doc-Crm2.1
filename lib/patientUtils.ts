import prisma from './prisma';

// Generate the next patient ID atomically using a PostgreSQL sequence.
//
// FIX: The previous implementation used SELECT MAX() + application-level increment,
// which had a race condition — two concurrent requests could read the same max
// and generate duplicate IDs. A DB sequence is inherently atomic.
//
// The sequence `patient_id_seq` is created by the migration:
//   prisma/migrations/add_patient_id_sequence.sql
export async function generatePatientId(): Promise<string> {
  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('patient_id_seq') AS nextval
  `;
  const nextNum = Number(result[0].nextval);
  return `FC-${String(nextNum).padStart(3, '0')}`;
}

// Format patient ID for display
export function formatPatientId(id: string): string {
  return id; // Already formatted as FC-XXX
}

// Search patients by name, contact, or patient ID
// Uses PostgreSQL full-text search for better performance at scale.
// Falls back to ILIKE search if full-text vectors are not populated.
//
// FIX: The full-text search requires search_vector to be populated via a
// DB trigger. When vectors are empty, the tsvector query succeeds but returns
// 0 rows. We now try full-text first and fall back to ILIKE automatically
// when full-text returns nothing — no silent zero-result failures.
export async function searchPatients(query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.trim();

  // Build a tsquery from the search term
  const tsQuery = searchTerm
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => term.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(term => term.length > 0)
    .join(' & ');

  // Try full-text search first if we have a valid tsQuery
  if (tsQuery) {
    try {
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
          ts_rank(p.search_vector, to_tsquery('english', ${tsQuery})) AS rank,
          lv.id          AS last_visit_id,
          lv."visitDate" AS last_visit_date,
          lv."visitType" AS last_visit_type,
          lv.diagnosis   AS last_visit_diagnosis
        FROM patients p
        LEFT JOIN LATERAL (
          SELECT v.id, v."visitDate", v."visitType", v.diagnosis
          FROM visits v
          WHERE v."patientId" = p.id
          ORDER BY v."visitDate" DESC
          LIMIT 1
        ) lv ON true
        WHERE p.search_vector @@ to_tsquery('english', ${tsQuery})
        ORDER BY rank DESC, p."updatedAt" DESC
        LIMIT 50
      `;

      // If full-text found results, return them
      if (patients.length > 0) {
        return patients.map(row => shapeSearchResult(row));
      }
      // Otherwise fall through to ILIKE fallback below
    } catch (error) {
      // Full-text search failed (e.g. invalid token) — fall through to ILIKE
      console.warn('Full-text search failed, falling back to ILIKE:', error);
    }
  }

  // ILIKE fallback — used when search_vector is not populated OR full-text
  // returned no results. Single JOIN query, no N+1.
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
        orderBy: { visitDate: 'desc' },
        take: 1,
      },
    },
    take: 50,
    orderBy: { updatedAt: 'desc' },
  });
}

function shapeSearchResult(row: any) {
  const lastVisit = row.last_visit_id
    ? [{
        id: row.last_visit_id,
        visitDate: row.last_visit_date,
        visitType: row.last_visit_type,
        diagnosis: row.last_visit_diagnosis,
      }]
    : [];

  return {
    id: row.id,
    patientId: row.patientId,
    name: row.name,
    age: row.age,
    gender: row.gender,
    contact: row.contact,
    address: row.address,
    bloodGroup: row.bloodGroup,
    allergies: row.allergies,
    chronicConditions: row.chronicConditions,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    visits: lastVisit,
  };
}

// Get recent patients (last 30 days)
export async function getRecentPatients(limit: number = 10) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await prisma.patient.findMany({
    where: {
      visits: {
        some: {
          visitDate: { gte: thirtyDaysAgo },
        },
      },
    },
    include: {
      visits: {
        orderBy: { visitDate: 'desc' },
        take: 1,
      },
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });
}
