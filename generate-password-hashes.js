const bcrypt = require('bcryptjs');

async function generateHashes() {
  try {
    // Generate hash for 'compass1234'
    const hash1 = await bcrypt.hash('compass1234', 8);
    console.log('Hash for compass1234:');
    console.log(hash1);
    console.log('');

    // Generate hash for 'admin123'
    const hash2 = await bcrypt.hash('admin123', 8);
    console.log('Hash for admin123:');
    console.log(hash2);
    console.log('');

    // SQL UPDATE statements
    console.log('=== SQL UPDATE STATEMENTS ===');
    console.log(`UPDATE "users" SET password = '${hash1}' WHERE email = 'demo@doxcia.com';`);
    console.log(`UPDATE "users" SET password = '${hash2}' WHERE email = 'admin@doxcia.com';`);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHashes();
