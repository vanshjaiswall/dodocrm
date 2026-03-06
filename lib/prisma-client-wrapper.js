/**
 * Prisma Client Wrapper for constrained environments
 * Provides access to Prisma client with workarounds for missing engines
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('better-sqlite3');

// Check if we can use better-sqlite3
let dbConnection = null;
let useSqlite = false;

try {
  const dbPath = path.join(__dirname, '../prisma/dev.db');
  dbConnection = require('better-sqlite3')(dbPath);
  useSqlite = true;
  console.log('[Prisma Wrapper] Using better-sqlite3 for direct database access');
} catch (e) {
  console.log('[Prisma Wrapper] better-sqlite3 not available, will use Prisma client');
}

// Try to use Prisma client with environment variable workaround
let prismaClient = null;

async function initPrismaClient() {
  if (prismaClient) return prismaClient;
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    // Try multiple approaches to get the client working
    // Approach 1: Use the binary option
    try {
      process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
      prismaClient = new PrismaClient({
        log: ['error', 'warn'],
      });
      return prismaClient;
    } catch (e1) {
      console.log('[Prisma Wrapper] Binary engine approach failed:', e1.message);
    }
    
    // Approach 2: Direct client without options
    try {
      delete process.env.PRISMA_CLIENT_ENGINE_TYPE;
      prismaClient = new PrismaClient();
      return prismaClient;
    } catch (e2) {
      console.log('[Prisma Wrapper] Direct approach failed:', e2.message);
      throw e2;
    }
  } catch (e) {
    console.error('[Prisma Wrapper] Failed to initialize Prisma client:', e.message);
    throw e;
  }
}

module.exports = {
  getPrismaClient: initPrismaClient,
  getDbConnection: () => dbConnection,
  usingSqliteDirectly: () => useSqlite,
};
