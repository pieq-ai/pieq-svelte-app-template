import { PrismaClient } from '../../src/generated/prisma/client.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pieq_hrms?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

/**
 * Cleans up the database completely. Be very careful with this!
 * Ideally used in global setup or teardown.
 */
export async function cleanDatabase() {
  const tableNames = [
    'employee', 'department', 'designation', 'system_roles', 'permissions', 'role_permission',
    'blood_group', 'nationality', 'employment_type', 'relation_type', 'document_type',
    'state', 'country', 'skills', 'attendance_source', 'languages', 'pay_grade'
  ];

  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
    } catch (e) {
      console.warn(`Failed to truncate ${tableName}:`, e);
    }
  }
}

/**
 * Helper to generate random string for unique fields
 */
export function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}
