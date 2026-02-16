import prisma from '../lib/prisma';

async function migrateFees() {
  console.log('Starting fee migration from notes to VisitFee table...\n');
  
  // Get all visits with fees in notes
  const visits = await prisma.visit.findMany({
    where: {
      notes: {
        contains: '__FEES_JSON__'
      }
    },
    select: {
      id: true,
      notes: true,
    }
  });
  
  console.log(`Found ${visits.length} visits with fees in notes\n`);
  
  if (visits.length === 0) {
    console.log('No visits to migrate. Exiting.');
    return;
  }
  
  let migrated = 0;
  let errors = 0;
  const errorDetails: Array<{ visitId: string; error: string }> = [];
  
  for (const visit of visits) {
    try {
      // Extract fees from notes
      const match = visit.notes?.match(/__FEES_JSON__(.+?)__FEES_JSON__/);
      if (!match) {
        console.warn(`⚠️  Visit ${visit.id}: No fee JSON found despite containing marker`);
        continue;
      }
      
      const feesData = JSON.parse(match[1]);
      
      if (!feesData.fees || !Array.isArray(feesData.fees)) {
        console.warn(`⚠️  Visit ${visit.id}: Invalid fee structure`);
        errorDetails.push({ visitId: visit.id, error: 'Invalid fee structure' });
        errors++;
        continue;
      }
      
      if (feesData.fees.length === 0) {
        console.warn(`⚠️  Visit ${visit.id}: Empty fees array`);
        continue;
      }
      
      // Create VisitFee records in a transaction
      await prisma.$transaction(async (tx) => {
        // Create fee records
        await tx.visitFee.createMany({
          data: feesData.fees.map((fee: any) => ({
            visitId: visit.id,
            serviceName: fee.serviceName || 'Service',
            amount: parseFloat(fee.amount) || 0,
            quantity: parseInt(fee.quantity) || 1,
            discount: parseFloat(fee.discount) || 0,
            total: parseFloat(fee.total) || 0,
          }))
        });
        
        // Remove fee JSON from notes
        const cleanNotes = visit.notes!
          .replace(/__FEES_JSON__.+?__FEES_JSON__\n?/, '')
          .trim();
        
        await tx.visit.update({
          where: { id: visit.id },
          data: { notes: cleanNotes || null }
        });
      });
      
      migrated++;
      
      if (migrated % 10 === 0) {
        console.log(`✅ Migrated ${migrated}/${visits.length} visits...`);
      }
    } catch (error) {
      console.error(`❌ Error migrating visit ${visit.id}:`, error);
      errorDetails.push({ 
        visitId: visit.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Migration Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successfully migrated: ${migrated} visits`);
  console.log(`❌ Errors: ${errors} visits`);
  console.log(`📊 Success rate: ${((migrated / visits.length) * 100).toFixed(1)}%`);
  
  if (errorDetails.length > 0) {
    console.log('\n⚠️  Error Details:');
    errorDetails.forEach(({ visitId, error }) => {
      console.log(`  - Visit ${visitId}: ${error}`);
    });
  }
  
  // Verify migration
  console.log('\n' + '='.repeat(50));
  console.log('Verification');
  console.log('='.repeat(50));
  
  const totalFees = await prisma.visitFee.count();
  console.log(`✅ Total VisitFee records created: ${totalFees}`);
  
  const remainingFeesInNotes = await prisma.visit.count({
    where: {
      notes: {
        contains: '__FEES_JSON__'
      }
    }
  });
  console.log(`${remainingFeesInNotes === 0 ? '✅' : '⚠️ '} Visits still with fees in notes: ${remainingFeesInNotes}`);
  
  if (remainingFeesInNotes > 0) {
    console.log('\n⚠️  Warning: Some visits still have fees in notes. You may need to re-run the migration.');
  } else {
    console.log('\n🎉 Migration successful! All fees have been moved to the VisitFee table.');
  }
}

migrateFees()
  .catch((error) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
