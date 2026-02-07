// FIX: Switched from a namespace import to a named import for the Prisma client to resolve module resolution issues.
// NOTE: Using Supabase with connection pooling for serverless compatibility
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Create client with pgbouncer-compatible settings for serverless
  const client = new PrismaClient({
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Optimize for serverless with connection pooling
    // @ts-ignore - connection_limit is valid but not in types
    connection_limit: 1,
    pool_timeout: 20,
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