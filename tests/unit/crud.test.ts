import { describe, it, expect, beforeAll } from 'vitest';
import * as roleDao from '../../src/lib/server/dao/role.dao.js';
import * as shiftDao from '../../src/lib/server/dao/shift.dao.js';
import * as locationDao from '../../src/lib/server/dao/organization_location.dao.js';
import { db } from '../../src/lib/server/db.js';

describe('Role, Shift, and Location CRUD Integration Tests', () => {
  beforeAll(async () => {
    await db.role.deleteMany({ where: { name: { in: ['Test Integration Role', 'Test Integration Role Updated'] } } });
    await db.shift.deleteMany({ where: { shift_name: { in: ['Test Integration Shift', 'Test Integration Shift Updated'] } } });
    await db.companyLocation.deleteMany({ where: { name: { in: ['Test Integration Location', 'Test Integration Location Updated'] } } });
  });

  it('should successfully perform CRUD on Role', async () => {
    // 1. Create Role
    const roleName = 'Test Integration Role';
    const newRole = await roleDao.createRole({ name: roleName });
    expect(newRole).toBeDefined();
    expect(newRole.name).toBe(roleName);
    expect(newRole.status).toBe(true);
    expect(newRole.cuid).toBeDefined();

    // 2. Read Role
    const fetchedRole = await roleDao.getRoleByCuid(newRole.cuid);
    expect(fetchedRole).not.toBeNull();
    expect(fetchedRole!.name).toBe(roleName);
    expect(fetchedRole!.status).toBe(true);

    // 3. Update Role
    const updatedName = 'Test Integration Role Updated';
    const updatedRole = await roleDao.updateRole(newRole.cuid, { name: updatedName });
    expect(updatedRole.name).toBe(updatedName);

    // 4. Soft Delete (Deactivate)
    const deactivatedRole = await roleDao.deactivateRole(newRole.cuid);
    expect(deactivatedRole.status).toBe(false);

    // 5. Cleanup (hard delete)
    const { db } = await import('../../src/lib/server/db.js');
    await db.role.delete({ where: { cuid: newRole.cuid } });
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
    expect(newShift.cuid).toBeDefined();

    // 2. Read Shift
    const fetchedShift = await shiftDao.getShiftByCuid(newShift.cuid);
    expect(fetchedShift).not.toBeNull();
    expect(fetchedShift!.shift_name).toBe(shiftName);
    expect(fetchedShift!.status).toBe(true);

    // 3. Update Shift (Change status to false)
    const updatedShift = await shiftDao.updateShift(newShift.cuid, { status: false });
    expect(updatedShift.status).toBe(false);

    // 4. Activate Shift
    const activatedShift = await shiftDao.activateShift(newShift.cuid);
    expect(activatedShift.status).toBe(true);

    // 5. Deactivate Shift
    const deactivatedShift = await shiftDao.deactivateShift(newShift.cuid);
    expect(deactivatedShift.status).toBe(false);

    // 6. Cleanup (hard delete)
    const { db } = await import('../../src/lib/server/db.js');
    await db.shift.delete({ where: { cuid: newShift.cuid } });
  });

  it('should successfully perform CRUD on Company Location', async () => {
    // 1. Create Location
    const locName = 'Test Integration Location';
    const newLocation = await locationDao.createLocation({
      name: locName,
      address_line1: '456 Test Blvd',
      city: 'Test City',
      state_cuid: 'state-cuid',
      country_cuid: 'country-cuid',
      pin_code: '123456',
      timezone: 'UTC'
    });
    expect(newLocation).toBeDefined();
    expect(newLocation.name).toBe(locName);
    expect(newLocation.status).toBe(true);
    expect(newLocation.cuid).toBeDefined();

    // 2. Read Location
    const fetchedLocation = await locationDao.getLocationByCuid(newLocation.cuid);
    expect(fetchedLocation).not.toBeNull();
    expect(fetchedLocation!.name).toBe(locName);
    expect(fetchedLocation!.status).toBe(true);

    // 3. Update Location
    const updatedName = 'Test Integration Location Updated';
    const updatedLocation = await locationDao.updateLocation(newLocation.cuid, { name: updatedName });
    expect(updatedLocation.name).toBe(updatedName);

    // 4. Deactivate Location
    const deactivatedLocation = await locationDao.deactivateLocation(newLocation.cuid);
    expect(deactivatedLocation.status).toBe(false);

    // 5. Activate Location
    const activatedLocation = await locationDao.activateLocation(newLocation.cuid);
    expect(activatedLocation.status).toBe(true);

    // 6. Cleanup (hard delete)
    const { db } = await import('../../src/lib/server/db.js');
    await db.companyLocation.delete({ where: { cuid: newLocation.cuid } });
  });
});

