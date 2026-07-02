// tests/unit/shift-assignment.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from '../../src/lib/server/services/shift-assignment.service.js';
import * as dao from '../../src/lib/server/dao/shift-assignment.dao.js';
import * as employeeDao from '../../src/lib/server/dao/employee.dao.js';
import * as shiftDao from '../../src/lib/server/dao/shift.dao.js';
import * as leaveDao from '../../src/lib/server/dao/leave.dao.js';
import * as leaveService from '../../src/lib/server/services/leave.service.js';
import * as employmentDao from '../../src/lib/server/dao/employment.dao.js';

vi.mock('../../src/lib/server/dao/shift-assignment.dao.js', () => ({
  listForSubordinates: vi.fn(),
  findByCuid: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deleteAssignment: vi.fn(),
  findOverlapping: vi.fn()
}));

vi.mock('../../src/lib/server/dao/employee.dao.js', () => ({
  getEmployeeByCuid: vi.fn()
}));

vi.mock('../../src/lib/server/dao/shift.dao.js', () => ({
  getShiftByCuid: vi.fn()
}));

vi.mock('../../src/lib/server/dao/leave.dao.js', () => ({
  getSubordinates: vi.fn()
}));

vi.mock('../../src/lib/server/dao/employment.dao.js', () => ({
  findByEmployeeCuid: vi.fn()
}));

vi.mock('../../src/lib/server/services/leave.service.js', () => ({
  resolveEmployee: vi.fn()
}));

describe('Shift Assignment Service Unit Tests', () => {
  const managerEmail = 'manager@example.com';
  const managerCuid = 'mgr-cuid';
  const subordinateCuid = 'sub-cuid';
  const nonSubordinateCuid = 'other-cuid';
  const shiftCuid = 'shift-cuid';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup: resolved manager and their reporting subordinates
    vi.mocked(leaveService.resolveEmployee).mockResolvedValue({
      employee: { cuid: managerCuid, personal_email: managerEmail } as any,
      employment: {} as any
    });

    vi.mocked(leaveDao.getSubordinates).mockResolvedValue([
      { employee_cuid: subordinateCuid }
    ] as any);

    vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
      employee_cuid: subordinateCuid,
      date_of_joining: new Date('2026-06-01T00:00:00.000Z'),
      relieving_date: null
    } as any);

    // Default target Employee and Shift are found and active
    vi.mocked(employeeDao.getEmployeeByCuid).mockImplementation(async (cuid) => {
      if (cuid === subordinateCuid || cuid === nonSubordinateCuid || cuid === managerCuid) {
        return { cuid, first_name: 'Test', last_name: 'User', emp_code: 'PQ123' };
      }
      return null;
    });

    vi.mocked(shiftDao.getShiftByCuid).mockResolvedValue({
      cuid: shiftCuid,
      name: 'Morning Shift',
      status: true
    } as any);
  });

  describe('getManagerSubordinates', () => {
    it('should resolve manager and load their subordinates', async () => {
      const res = await service.getManagerSubordinates(managerEmail);
      expect(res.manager.cuid).toBe(managerCuid);
      expect(res.subordinates).toHaveLength(1);
      expect(res.subordinates[0].employee_cuid).toBe(subordinateCuid);
    });
  });

  describe('listAssignments', () => {
    it('should return empty array if manager has no subordinates', async () => {
      vi.mocked(leaveDao.getSubordinates).mockResolvedValue([]);
      const result = await service.listAssignments(managerEmail);
      expect(result).toEqual([]);
      expect(dao.listForSubordinates).not.toHaveBeenCalled();
    });

    it('should call dao.listForSubordinates for manager subordinates', async () => {
      const mockAssignments = [
        { cuid: 'a-1', employee_cuid: subordinateCuid, shift_cuid: shiftCuid }
      ];
      vi.mocked(dao.listForSubordinates).mockResolvedValue(mockAssignments as any);

      const result = await service.listAssignments(managerEmail);
      expect(dao.listForSubordinates).toHaveBeenCalledWith([subordinateCuid]);
      expect(result).toEqual(mockAssignments);
    });
  });

  describe('getAssignmentDetails', () => {
    it('should throw 404 if assignment not found', async () => {
      vi.mocked(dao.findByCuid).mockResolvedValue(null);
      await expect(
        service.getAssignmentDetails('a-missing', managerEmail)
      ).rejects.toThrow('Shift assignment not found');
    });

    it('should throw 403 if assignment belongs to non-subordinate', async () => {
      vi.mocked(dao.findByCuid).mockResolvedValue({
        cuid: 'a-1',
        employee_cuid: nonSubordinateCuid
      } as any);

      await expect(
        service.getAssignmentDetails('a-1', managerEmail)
      ).rejects.toThrow('Unauthorized: Assignment belongs to an employee who is not your direct report');
    });

    it('should return details if subordinate match passes', async () => {
      const mockAss = { cuid: 'a-1', employee_cuid: subordinateCuid };
      vi.mocked(dao.findByCuid).mockResolvedValue(mockAss as any);

      const result = await service.getAssignmentDetails('a-1', managerEmail);
      expect(result).toEqual(mockAss);
    });
  });

  describe('createAssignment', () => {
    const validPayload = {
      employee_cuid: subordinateCuid,
      shift_cuid: shiftCuid,
      effective_from: '2026-07-01',
      effective_to: '2026-07-10',
      status: true
    };

    it('should validate inputs correctly and check subordinate authorization', async () => {
      // Non-subordinate payload should trigger 403
      await expect(
        service.createAssignment({ ...validPayload, employee_cuid: nonSubordinateCuid }, managerEmail)
      ).rejects.toThrow('Unauthorized: You can only assign shifts to your reporting direct subordinates');
    });

    it('should throw 404 if target shift is not found', async () => {
      vi.mocked(shiftDao.getShiftByCuid).mockResolvedValue(null);
      await expect(
        service.createAssignment(validPayload, managerEmail)
      ).rejects.toThrow('Target shift not found');
    });

    it('should throw 400 if target shift is inactive', async () => {
      vi.mocked(shiftDao.getShiftByCuid).mockResolvedValue({
        cuid: shiftCuid,
        name: 'Morning Shift',
        status: false
      } as any);

      await expect(
        service.createAssignment(validPayload, managerEmail)
      ).rejects.toThrow('Cannot assign an inactive shift');
    });

    it('should throw 409 if active overlap exists', async () => {
      vi.mocked(dao.findOverlapping).mockResolvedValue({ cuid: 'existing-overlap' } as any);

      await expect(
        service.createAssignment(validPayload, managerEmail)
      ).rejects.toThrow('An active shift assignment already exists for this employee in the specified period');
    });

    it('should create assignment when everything is valid', async () => {
      vi.mocked(dao.findOverlapping).mockResolvedValue(null);
      const mockCreated = { cuid: 'a-new', ...validPayload };
      vi.mocked(dao.create).mockResolvedValue(mockCreated as any);

      const result = await service.createAssignment(validPayload, managerEmail);
      expect(result).toEqual(mockCreated);
      expect(dao.create).toHaveBeenCalled();
    });

    it('should create ongoing assignment when effective_to is null or omitted', async () => {
      vi.mocked(dao.findOverlapping).mockResolvedValue(null);
      const ongoingPayload = {
        employee_cuid: subordinateCuid,
        shift_cuid: shiftCuid,
        effective_from: '2026-07-01',
        effective_to: null,
        status: true
      };
      const mockCreated = { cuid: 'a-new-ongoing', ...ongoingPayload };
      vi.mocked(dao.create).mockResolvedValue(mockCreated as any);

      const result = await service.createAssignment(ongoingPayload, managerEmail);
      expect(result).toEqual(mockCreated);
      expect(dao.create).toHaveBeenCalledWith(expect.objectContaining({
        effective_to: null
      }));
    });

    it('should throw 400 if effective_from is before employee joining date', async () => {
      vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
        employee_cuid: subordinateCuid,
        date_of_joining: new Date('2026-07-05T00:00:00.000Z'),
        relieving_date: null
      } as any);

      await expect(
        service.createAssignment(validPayload, managerEmail)
      ).rejects.toThrow("Shift assignment effective from date cannot be before the employee's joining date.");
    });

    it('should throw 400 if effective_to is after employee relieving date', async () => {
      vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
        employee_cuid: subordinateCuid,
        date_of_joining: new Date('2026-06-01T00:00:00.000Z'),
        relieving_date: new Date('2026-07-08T00:00:00.000Z')
      } as any);

      await expect(
        service.createAssignment(validPayload, managerEmail)
      ).rejects.toThrow("Shift assignment effective to date cannot be after the employee's relieving date.");
    });
  });

  describe('updateAssignment', () => {
    const existingAss = {
      cuid: 'a-1',
      employee_cuid: subordinateCuid,
      shift_cuid: shiftCuid,
      effective_from: '2026-07-01',
      effective_to: '2026-07-10',
      status: true
    };

    const updatePayload = {
      effective_from: '2026-07-05',
      effective_to: '2026-07-15'
    };

    beforeEach(() => {
      vi.mocked(dao.findByCuid).mockResolvedValue(existingAss as any);
    });

    it('should throw 403 if existing assignment employee is not a subordinate', async () => {
      vi.mocked(dao.findByCuid).mockResolvedValue({
        ...existingAss,
        employee_cuid: nonSubordinateCuid
      } as any);

      await expect(
        service.updateAssignment('a-1', updatePayload, managerEmail)
      ).rejects.toThrow('Unauthorized: Assignment belongs to an employee who is not your direct report');
    });

    it('should throw 403 if updating assignment employee_cuid to a non-subordinate', async () => {
      await expect(
        service.updateAssignment('a-1', { employee_cuid: nonSubordinateCuid }, managerEmail)
      ).rejects.toThrow('Unauthorized: You can only assign shifts to your reporting direct subordinates');
    });

    it('should check for overlaps correctly excluding the current assignment CUID', async () => {
      vi.mocked(dao.findOverlapping).mockResolvedValue({ cuid: 'another-one' } as any);

      await expect(
        service.updateAssignment('a-1', updatePayload, managerEmail)
      ).rejects.toThrow('An active shift assignment already exists for this employee in the specified period');

      expect(dao.findOverlapping).toHaveBeenCalledWith(
        subordinateCuid,
        expect.any(Date),
        expect.any(Date),
        'a-1'
      );
    });

    it('should update correctly when parameters are valid', async () => {
      vi.mocked(dao.findOverlapping).mockResolvedValue(null);
      const mockUpdated = { ...existingAss, effective_from: '2026-07-05', effective_to: '2026-07-15' };
      vi.mocked(dao.update).mockResolvedValue(mockUpdated as any);

      const result = await service.updateAssignment('a-1', updatePayload, managerEmail);
      expect(result).toEqual(mockUpdated);
    });

    it('should update and remove end date (ongoing) when effective_to is null', async () => {
      vi.mocked(dao.findOverlapping).mockResolvedValue(null);
      const mockUpdated = { ...existingAss, effective_to: null };
      vi.mocked(dao.update).mockResolvedValue(mockUpdated as any);

      const result = await service.updateAssignment('a-1', { effective_to: null }, managerEmail);
      expect(result).toEqual(mockUpdated);
      expect(dao.update).toHaveBeenCalledWith('a-1', expect.objectContaining({
        effective_to: null
      }));
    });

    it('should throw 400 if updated effective_from is before employee joining date', async () => {
      vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
        employee_cuid: subordinateCuid,
        date_of_joining: new Date('2026-07-03T00:00:00.000Z'),
        relieving_date: null
      } as any);

      await expect(
        service.updateAssignment('a-1', { effective_from: '2026-07-02' }, managerEmail)
      ).rejects.toThrow("Shift assignment effective from date cannot be before the employee's joining date.");
    });

    it('should throw 400 if updated effective_to is after employee relieving date', async () => {
      vi.mocked(employmentDao.findByEmployeeCuid).mockResolvedValue({
        employee_cuid: subordinateCuid,
        date_of_joining: new Date('2026-06-01T00:00:00.000Z'),
        relieving_date: new Date('2026-07-12T00:00:00.000Z')
      } as any);

      await expect(
        service.updateAssignment('a-1', { effective_to: '2026-07-15' }, managerEmail)
      ).rejects.toThrow("Shift assignment effective to date cannot be after the employee's relieving date.");
    });
  });

  describe('deleteAssignment', () => {
    it('should throw 403 if assignment belongs to non-subordinate', async () => {
      vi.mocked(dao.findByCuid).mockResolvedValue({
        cuid: 'a-1',
        employee_cuid: nonSubordinateCuid
      } as any);

      await expect(
        service.deleteAssignment('a-1', managerEmail)
      ).rejects.toThrow('Unauthorized: Assignment belongs to an employee who is not your direct report');
    });

    it('should delete from DB when match passes', async () => {
      vi.mocked(dao.findByCuid).mockResolvedValue({
        cuid: 'a-1',
        employee_cuid: subordinateCuid
      } as any);

      await service.deleteAssignment('a-1', managerEmail);
      expect(dao.deleteAssignment).toHaveBeenCalledWith('a-1');
    });
  });
});
