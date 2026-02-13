// FIX: Switched from a namespace import to a named import for the Prisma client to resolve module resolution issues.
// NOTE: Using Supabase with connection pooling for serverless compatibility
// 
// BETA ARCHITECTURE DECISION: Single PrismaClient instance with connection pooling
// REASON: Serverless environment requires careful connection management
// RISK: Connection pool exhaustion at scale (already hitting limits at 41 patients)
// IMPACT: Timeouts during concurrent usage, requires connection pool parameters in DATABASE_URL
// MIGRATION PATH: 
//   1. Upgrade database tier for higher connection limits
//   2. Implement connection pooling with pgBouncer parameters
//   3. Add read replicas for analytics queries
//   4. Consider database sharding at 1,000+ clinics
// ESTIMATED EFFORT: 1-2 weeks post-funding
// TODO POST-FUNDING: Implement proper connection pooling strategy
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Create client with pgbouncer-compatible settings for serverless
  // Connection pooling parameters should be in DATABASE_URL, not here
  const client = new PrismaClient({
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  
  return client
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

// Ensure proper cleanup on serverless
if (process.env.NODE_ENV === 'production') {
  // Don't keep connections open in serverless
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}