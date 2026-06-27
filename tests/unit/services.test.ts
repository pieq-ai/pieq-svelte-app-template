import { describe, it, expect, beforeAll } from 'vitest';
import * as roleService from '../../src/lib/server/services/role.service.js';
import * as shiftService from '../../src/lib/server/services/shift.service.js';
import * as locationService from '../../src/lib/server/services/organization_location.service.js';
import * as leaveService from '../../src/lib/server/services/leave.service.js';
import { db } from '../../src/lib/server/db.js';

describe('Service Layer Unit Tests', () => {
  beforeAll(async () => {
    await db.role.deleteMany({ where: { name: { in: ['Service HR', 'Service HR Updated'] } } });
    await db.shift.deleteMany({ where: { name: { in: ['Service Shift', 'Sibling Shift'] } } });
    await db.companyLocation.deleteMany({ where: { name: { in: ['Service Location'] } } });
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
        name: 'Service Shift',
        start_time: '1970-01-01T09:00:00Z',
        end_time: '1970-01-01T17:00:00Z',
        minimum_work_hours: 8
      });
      expect(shift).toBeDefined();
      expect(shift.name).toBe('Service Shift');
      expect(shift.status).toBe(true);

      // 2. Expect duplicate name to throw 409
      await expect(shiftService.createShift({
        name: 'Service Shift',
        start_time: '1970-01-01T09:00:00Z',
        end_time: '1970-01-01T17:00:00Z',
        minimum_work_hours: 8
      })).rejects.toThrow('Shift name already exists');

      // 3. Update Shift
      const updated = await shiftService.updateShift(shift.cuid, { minimum_work_hours: 7.5 });
      expect(Number(updated.minimum_work_hours)).toBe(7.5);

      // 4. Update Shift with duplicate name throws 409
      const sibling = await shiftService.createShift({
        name: 'Sibling Shift',
        start_time: '1970-01-01T09:30:00Z',
        end_time: '1970-01-01T17:30:00Z',
        minimum_work_hours: 8
      });
      await expect(shiftService.updateShift(shift.cuid, { name: 'Sibling Shift' })).rejects.toThrow('Shift name already exists');

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
        name: 'Service Location',
        address_line1: '123 Service Road',
        city: 'Service City',
        state_cuid: 'state-cuid',
        country_cuid: 'country-cuid',
        pin_code: '123456',
        timezone: 'UTC',
        latitude: 12.9716,
        longitude: 77.5946
      });
      expect(location).toBeDefined();
      expect(location.name).toBe('Service Location');
      expect(location.status).toBe(true);
      expect(Number(location.latitude)).toBe(12.9716);
      expect(Number(location.longitude)).toBe(77.5946);

      // 2. Expect duplicate name to throw 409
      await expect(locationService.createLocation({
        name: 'Service Location',
        address_line1: '123 Service Road',
        city: 'Service City',
        state_cuid: 'state-cuid',
        country_cuid: 'country-cuid',
        pin_code: '123456',
        timezone: 'UTC'
      })).rejects.toThrow('Company Location name already exists');

      // 3. Update Location
      const updated = await locationService.updateLocation(location.cuid, { city: 'New City', latitude: 13.0827, longitude: 80.2707 });
      expect(updated.city).toBe('New City');
      expect(Number(updated.latitude)).toBe(13.0827);
      expect(Number(updated.longitude)).toBe(80.2707);

      // 4. Delete Location (soft delete)
      const deactivated = await locationService.deleteLocation(location.cuid);
      expect(deactivated.status).toBe(false);

      // 5. Activate Location
      const activated = await locationService.activateLocation(location.cuid);
      expect(activated.status).toBe(true);

      // 6. Cleanup
      await db.companyLocation.delete({ where: { cuid: location.cuid } });
    });
  });

  describe('Leave Service (Document Storage)', () => {
    it('should apply leave with database-backed document storage and retrieve it', async () => {
      // Create a test employee if they don't exist
      let emp = await db.employee.findFirst({
        where: { personal_email: 'test.service@example.com' }
      });
      if (!emp) {
        emp = await db.employee.create({
          data: {
            emp_code: 'TSTSEV001',
            first_name: 'Test',
            last_name: 'Service',
            gender: 'Female',
            personal_email: 'test.service@example.com'
          }
        });
      }

      let employment = await db.employment.findFirst({
        where: { employee_cuid: emp.cuid }
      });
      if (!employment) {
        let dept = await db.department.findFirst();
        if (!dept) {
          dept = await db.department.create({
            data: {
              name: 'Test Department'
            }
          });
        }

        let desig = await db.designation.findFirst();
        if (!desig) {
          desig = await db.designation.create({
            data: {
              name: 'Test Designation'
            }
          });
        }

        employment = await db.employment.create({
          data: {
            employee_cuid: emp.cuid,
            official_email: 'test.service.official@example.com',
            employment_status: 'active',
            date_of_joining: new Date('2025-01-01'),
            department_cuid: dept.cuid,
            designation_cuid: desig.cuid
          }
        });
      }

      let leavePolicy = await db.leavePolicy.findFirst({
        where: { status: true }
      });
      let leaveType = null;
      if (leavePolicy) {
        leaveType = await db.leaveType.findFirst({
          where: {
            cuid: leavePolicy.leave_type_cuid,
            status: true,
            code: { notIn: ['ML', 'PL'] }
          }
        });
      }
      let createdTempType = false;
      if (!leaveType) {
        leaveType = await db.leaveType.create({
          data: {
            name: 'Temp Document Test Leave',
            code: 'TDTL',
            is_paid: true,
            requires_approval: true,
            status: true
          }
        });
        await db.leavePolicy.create({
          data: {
            leave_type_cuid: leaveType.cuid,
            annual_limit: 10.0,
            status: true
          }
        });
        createdTempType = true;
      }

      // Cleanup any previous overlapping leave requests
      await db.leaveRequest.deleteMany({
        where: { employee_cuid: emp.cuid }
      });

      // Apply leave request with document
      const req = await leaveService.applyLeave('test.service.official@example.com', {
        leaveTypeCuid: leaveType.cuid,
        startDate: '2026-06-10',
        endDate: '2026-06-10',
        isHalfDay: false,
        reason: 'Testing database binary document storage',
        document: {
          fileName: 'health_cert.pdf',
          mimeType: 'application/pdf',
          base64Data: Buffer.from('Mock PDF Content').toString('base64')
        }
      });

      expect(req).toBeDefined();
      expect(req.file_name).toBe('health_cert.pdf');
      expect(req.mime_type).toBe('application/pdf');
      expect(req.file_size).toBe(Buffer.from('Mock PDF Content').length);
      expect(req.document_data).toBeDefined();

      // Retrieve the request and ensure document fields are correct
      const details = await leaveService.getEmployeeLeaveDetails('test.service.official@example.com', 2026);
      const retrievedReq = details.requests.find((r: any) => r.cuid === req.cuid);
      expect(retrievedReq).toBeDefined();
      expect(retrievedReq?.document_url).toBe(`/api/leaves/${req.cuid}/document`);
      expect(retrievedReq?.file_name).toBe('health_cert.pdf');

      // Cleanup
      await db.leaveRequest.delete({ where: { cuid: req.cuid } });
      if (createdTempType && leaveType) {
        await db.leavePolicy.deleteMany({ where: { leave_type_cuid: leaveType.cuid } });
        await db.leaveType.delete({ where: { cuid: leaveType.cuid } });
      }
      await db.employment.delete({ where: { cuid: employment.cuid } });
      await db.employee.delete({ where: { cuid: emp.cuid } });
    }, 30000);
  });
});
