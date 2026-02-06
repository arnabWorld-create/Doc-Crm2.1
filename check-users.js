const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.sxrolbjqenouqppjycmo:Puchu889956@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
    }
  }
});

async function checkUsers() {
  try {
    console.log('Fetching users...');
    const users = await prisma.$queryRaw`SELECT id, email, name, role, "isActive", LEFT(password, 10) as password_start, LENGTH(password) as password_length FROM users`;
    
    console.log('\nFound', users.length, 'users:');
    users.forEach(user => {
      console.log('\n---');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('Password hash starts with:', user.password_start);
      console.log('Password hash length:', user.password_length);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
