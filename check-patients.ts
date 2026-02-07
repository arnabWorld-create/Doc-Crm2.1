import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const patients = await prisma.patient.findMany({
    select: { patientId: true, name: true },
    orderBy: { patientId: 'asc' }
  });
  
  console.log(`Total patients: ${patients.length}`);
  console.log('\nExisting Patient IDs:');
  patients.forEach(p => console.log(`${p.patientId} - ${p.name}`));
  
  // Find the highest number
  const numbers = patients
    .map(p => parseInt(p.patientId.split('-')[1]))
    .filter(n => !isNaN(n));
  
  const maxNumber = Math.max(...numbers, 0);
  console.log(`\nHighest patient number: ${maxNumber}`);
  console.log(`Next available: FC-${String(maxNumber + 1).padStart(3, '0')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
