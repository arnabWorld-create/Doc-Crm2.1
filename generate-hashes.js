const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password1 = 'compass1234';
  const password2 = 'admin123';
  
  const hash1 = await bcrypt.hash(password1, 8);
  const hash2 = await bcrypt.hash(password2, 8);
  
  console.log('Demo user (demo@doxcia.com / compass1234):');
  console.log(hash1);
  console.log('\nAdmin user (admin@doxcia.com / admin123):');
  console.log(hash2);
}

generateHashes();
