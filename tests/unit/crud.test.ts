import { describe, it, expect } from 'vitest';
import * as roleDao from '../../src/lib/server/dao/role.dao.js';
import * as shiftDao from '../../src/lib/server/dao/shift.dao.js';

describe('Role and Shift CRUD Integration Tests', () => {
  it('should successfully perform CRUD on Role', async () => {
    // 1. Create Role
    const roleName = 'Test Integration Role';
    const newRole = await roleDao.createRole({ name: roleName });
    expect(newRole).toBeDefined();
    expect(newRole.name).toBe(roleName);
    expect(newRole.status).toBe(true);
    expect(newRole.cuid).toBeDefined();

    // 2. Read Role
    const fetchedRole = await roleDao.getRoleById(newRole.role_id);
    expect(fetchedRole).not.toBeNull();
    expect(fetchedRole!.name).toBe(roleName);
    expect(fetchedRole!.status).toBe(true);

    // 3. Update Role
    const updatedName = 'Test Integration Role Updated';
    const updatedRole = await roleDao.updateRole(newRole.role_id, { name: updatedName });
    expect(updatedRole.name).toBe(updatedName);

    // 4. Soft Delete (Deactivate)
    const deactivatedRole = await roleDao.deactivateRole(newRole.role_id);
    expect(deactivatedRole.status).toBe(false);

    // 5. Cleanup (hard delete)
    const { db } = await import('../../src/lib/server/db.js');
    await db.role.delete({ where: { role_id: newRole.role_id } });
  });

  it('should successfully perform CRUD on Shift', async () => {
    // 1. Create Shift
    const shiftName = 'Test Integration Shift';
    const newShift = await shiftDao.createShift({
      shift_name: shiftName,
      start_time: '1970-01-01T08:00:00.000Z',
      end_time: '1970-01-01T17:00:00.000Z',
      minimum_work_hours: 8.0
    });
    expect(newShift).toBeDefined();
    expect(newShift.shift_name).toBe(shiftName);
    expect(newShift.status).toBe(true);

    // 2. Read Shift
    const fetchedShift = await shiftDao.getShiftById(newShift.shift_id);
    expect(fetchedShift).not.toBeNull();
    expect(fetchedShift!.shift_name).toBe(shiftName);
    expect(fetchedShift!.status).toBe(true);

    // 3. Update Shift (Change status to false)
    const updatedShift = await shiftDao.updateShift(newShift.shift_id, { status: false });
    expect(updatedShift.status).toBe(false);

    // 4. Activate Shift
    const activatedShift = await shiftDao.activateShift(newShift.shift_id);
    expect(activatedShift.status).toBe(true);

    // 5. Deactivate Shift
    const deactivatedShift = await shiftDao.deactivateShift(newShift.shift_id);
    expect(deactivatedShift.status).toBe(false);

    // 6. Cleanup (hard delete)
    const { db } = await import('../../src/lib/server/db.js');
    await db.shift.delete({ where: { shift_id: newShift.shift_id } });
  });
});
