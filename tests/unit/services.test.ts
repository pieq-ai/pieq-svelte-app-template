import { describe, it, expect, beforeAll } from 'vitest';
import * as roleService from '../../src/lib/server/services/role.service.js';
import * as shiftService from '../../src/lib/server/services/shift.service.js';
import * as locationService from '../../src/lib/server/services/organization_location.service.js';
import { db } from '../../src/lib/server/db.js';

describe('Service Layer Unit Tests', () => {
  beforeAll(async () => {
    await db.role.deleteMany({ where: { name: { in: ['Service HR', 'Service HR Updated'] } } });
    await db.shift.deleteMany({ where: { shift_name: { in: ['Service Shift', 'Sibling Shift'] } } });
    await db.companyLocation.deleteMany({ where: { location_name: { in: ['Service Location'] } } });
  });

  describe('Role Service', () => {
    it('should cleanly create, duplicate check, update, list, and soft delete Roles', async () => {
      // 1. Create a Role
      const role = await roleService.createRole({ name: 'Service HR' });
      expect(role).toBeDefined();
      expect(role.name).toBe('Service HR');
      expect(role.status).toBe(true);

      // 2. Expect duplicate name creation to throw 409
      await expect(roleService.createRole({ name: 'Service HR' })).rejects.toThrow('Role name already exists');

      // 3. List Roles
      const activeList = await roleService.listRoles({ page: 1, limit: 10 });
      expect(activeList.data.some((r) => r.cuid === role.cuid)).toBe(true);

      const allList = await roleService.listAllRoles({ page: 1, limit: 10 });
      expect(allList.data.some((r) => r.cuid === role.cuid)).toBe(true);

      // 4. Update Role
      const updated = await roleService.updateRole(role.cuid, { name: 'Service HR Updated' });
      expect(updated.name).toBe('Service HR Updated');

      // 5. Update non-existent Role CUID should throw 404
      await expect(roleService.updateRole('nonexistentcuid12345', { name: 'New Name' })).rejects.toThrow('Role not found');

      // 6. Delete Role (soft delete)
      const deleted = await roleService.deleteRole(role.cuid);
      expect(deleted.status).toBe(false);

      // 7. Delete non-existent Role CUID should throw 404
      await expect(roleService.deleteRole('nonexistentcuid12345')).rejects.toThrow('Role not found');

      // 8. Cleanup
      await db.role.delete({ where: { cuid: role.cuid } });
    });
  });

  describe('Shift Service', () => {
    it('should cleanly create, duplicate check, update, activate, and deactivate Shifts', async () => {
      // 1. Create a Shift
      const shift = await shiftService.createShift({
        shift_name: 'Service Shift',
        start_time: '1970-01-01T09:00:00Z',
        end_time: '1970-01-01T17:00:00Z',
        minimum_work_hours: 8
      });
      expect(shift).toBeDefined();
      expect(shift.shift_name).toBe('Service Shift');
      expect(shift.status).toBe(true);

      // 2. Expect duplicate name to throw 409
      await expect(shiftService.createShift({
        shift_name: 'Service Shift',
        start_time: '1970-01-01T09:00:00Z',
        end_time: '1970-01-01T17:00:00Z',
        minimum_work_hours: 8
      })).rejects.toThrow('Shift name already exists');

      // 3. Update Shift
      const updated = await shiftService.updateShift(shift.cuid, { minimum_work_hours: 7.5 });
      expect(Number(updated.minimum_work_hours)).toBe(7.5);

      // 4. Update Shift with duplicate name throws 409
      const sibling = await shiftService.createShift({
        shift_name: 'Sibling Shift',
        start_time: '1970-01-01T09:00:00Z',
        end_time: '1970-01-01T17:00:00Z',
        minimum_work_hours: 8
      });
      await expect(shiftService.updateShift(shift.cuid, { shift_name: 'Sibling Shift' })).rejects.toThrow('Shift name already exists');

      // 5. Delete Shift (soft delete)
      const deactivated = await shiftService.deleteShift(shift.cuid);
      expect(deactivated.status).toBe(false);

      // 6. Activate Shift
      const activated = await shiftService.activateShift(shift.cuid);
      expect(activated.status).toBe(true);

      // 7. Cleanup
      await db.shift.delete({ where: { cuid: shift.cuid } });
      await db.shift.delete({ where: { cuid: sibling.cuid } });
    });
  });

  describe('Company Location Service', () => {
    it('should cleanly create, duplicate check, update, activate, and deactivate Locations', async () => {
      // 1. Create a Location
      const location = await locationService.createLocation({
        location_name: 'Service Location',
        address_line1: '123 Service Road',
        city: 'Service City',
        state_cuid: 'state-cuid',
        country_cuid: 'country-cuid',
        pin_code: '123456',
        timezone: 'UTC'
      });
      expect(location).toBeDefined();
      expect(location.location_name).toBe('Service Location');
      expect(location.is_active).toBe(true);

      // 2. Expect duplicate name to throw 409
      await expect(locationService.createLocation({
        location_name: 'Service Location',
        address_line1: '123 Service Road',
        city: 'Service City',
        state_cuid: 'state-cuid',
        country_cuid: 'country-cuid',
        pin_code: '123456',
        timezone: 'UTC'
      })).rejects.toThrow('Company Location name already exists');

      // 3. Update Location
      const updated = await locationService.updateLocation(location.cuid, { city: 'New City' });
      expect(updated.city).toBe('New City');

      // 4. Delete Location (soft delete)
      const deactivated = await locationService.deleteLocation(location.cuid);
      expect(deactivated.is_active).toBe(false);

      // 5. Activate Location
      const activated = await locationService.activateLocation(location.cuid);
      expect(activated.is_active).toBe(true);

      // 6. Cleanup
      await db.companyLocation.delete({ where: { cuid: location.cuid } });
    });
  });
});
