import { describe, it, expect } from 'vitest';
import { db } from '../../src/lib/server/db.js';

describe('Timestamp and API Response Verification', () => {
  it('Verify Prisma @updatedAt behavior', async () => {
    // Clean up if exists
    await db.role.deleteMany({ where: { name: 'Verification Role' } });

    // Create record
    const role = await db.role.create({
      data: { name: 'Verification Role', status: true }
    });

    console.log('--- Database Record Created ---');
    console.log('created_at:', role.created_at);
    console.log('updated_at:', role.updated_at);

    // Wait a brief moment to ensure system clock moves forward
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update status to verify if Prisma automatically updates updated_at via @updatedAt hook
    const updatedRole = await db.role.update({
      where: { cuid: role.cuid },
      data: { status: false }
    });

    console.log('--- Database Record Updated ---');
    console.log('created_at:', updatedRole.created_at);
    console.log('updated_at:', updatedRole.updated_at);
    
    const didChange = updatedRole.updated_at !== null && (role.updated_at === null || updatedRole.updated_at.getTime() !== role.updated_at.getTime());
    console.log('Did updated_at change?', didChange);

    // Clean up
    await db.role.delete({ where: { cuid: role.cuid } });

    expect(didChange).toBe(true);
  });
});
