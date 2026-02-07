import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

// Test database URL (SQLite in-memory)
const TEST_DATABASE_URL = 'file:./test.db'

// Global test Prisma client
let prisma: PrismaClient

export const setupTestDb = async () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasourceUrl: TEST_DATABASE_URL,
    })

    // Create test database schema
    try {
      execSync('npx prisma generate --schema=./prisma/schema.prisma', {
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
      })

      execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
      })
    } catch (error) {
      console.error('Error setting up test database:', error)
    }
  }

  return prisma
}

export const teardownTestDb = async () => {
  if (prisma) {
    await prisma.$disconnect()
  }

  // Clean up test database file
  try {
    execSync('rm -f test.db test.db-journal test.db-wal test.db-shm')
  } catch (error) {
    // Ignore cleanup errors
  }
}

export const clearTestDb = async () => {
  if (prisma) {
    // Clear all tables
    await prisma.user.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    // Add more tables as needed
  }
}
