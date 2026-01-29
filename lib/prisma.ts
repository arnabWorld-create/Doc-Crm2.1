// FIX: Switched from a namespace import to a named import for the Prisma client to resolve module resolution issues.
// NOTE: Using Supabase REST API instead of direct Prisma connection due to firewall restrictions on port 5432
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Create client but don't connect immediately
  const client = new PrismaClient({
    errorFormat: 'pretty',
  })
  
  return client
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma