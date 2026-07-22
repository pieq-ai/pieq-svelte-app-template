// src/lib/server/services/shift-assignment.service.ts
import * as shiftAssignmentDao from '$lib/server/dao/shift-assignment.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as shiftDao from '$lib/server/dao/shift.dao.js';
import * as leaveDao from '$lib/server/dao/leave.dao.js';
import * as employmentDao from '$lib/server/dao/employment.dao.js';
import { resolveEmployee } from '$lib/server/services/leave.service.js';
import { validateCreatePayload, validateUpdatePayload } from '$lib/server/validators/shift-assignment.validator.js';
import type { ShiftAssignment, ShiftAssignmentCreateDTO, ShiftAssignmentUpdateDTO } from '$lib/types/shift-assignment';
import { notificationFactory } from '$lib/server/notifications/notification.factory.js';
import { db } from '$lib/server/db.js';
import * as auditService from '$lib/server/services/audit.service.js';

/**
 * Parses a date string (YYYY-MM-DD) or Date object into a UTC Date.
 */
export function parseDateUTC(raw: string | Date): Date {
  if (raw instanceof Date) {
    return new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate()));
  }
  const parts = String(raw).split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Helper to retrieve manager details and their direct subordinates.
 */
export async function getManagerSubordinates(managerEmail: string) {
  const { employee } = await resolveEmployee(managerEmail);
  if (!employee) {
    throw new Error('Manager employee profile not found');
  }

  const subordinates = await leaveDao.getSubordinates(employee.cuid);
  return { manager: employee, subordinates };
}

/**
 * List all shift assignments of subordinates reporting to the manager.
 */
export async function listAssignments(managerEmail: string): Promise<ShiftAssignment[]> {
  const { subordinates } = await getManagerSubordinates(managerEmail);
  if (subordinates.length === 0) {
    return [];
  }

  const subordinateCuids = subordinates.map((s: any) => s.employee_cuid);
  return shiftAssignmentDao.listForSubordinates(subordinateCuids);
}

/**
 * Get details of a single shift assignment, verifying it belongs to a subordinate.
 */
export async function getAssignmentDetails(cuid: string, managerEmail: string): Promise<ShiftAssignment> {
  const { subordinates } = await getManagerSubordinates(managerEmail);
  const subordinateCuids = new Set(subordinates.map((s: any) => s.employee_cuid));

  const assignment = await shiftAssignmentDao.findByCuid(cuid);
  if (!assignment) {
    const err: any = new Error('Shift assignment not found');
    err.status = 404;
    throw err;
  }

  if (!subordinateCuids.has(assignment.employee_cuid)) {
    const err: any = new Error('Unauthorized: Assignment belongs to an employee who is not your direct report');
    err.status = 403;
    throw err;
  }

  return assignment;
}

/**
 * Create a new shift assignment.
 */
export async function createAssignment(payload: unknown, managerEmail: string): Promise<ShiftAssignment> {
  // 1. Validate payload structure
  const validated = validateCreatePayload(payload);

  // 2. Authorize manager & subordinate relationship
  const { subordinates } = await getManagerSubordinates(managerEmail);
  const subordinateCuids = new Set(subordinates.map((s: any) => s.employee_cuid));

  if (!subordinateCuids.has(validated.employee_cuid)) {
    const err: any = new Error('Unauthorized: You can only assign shifts to your reporting direct subordinates');
    err.status = 403;
    throw err;
  }

  // 3. Verify target employee exists
  const employee = await employeeDao.getEmployeeByCuid(validated.employee_cuid);
  if (!employee) {
    const err: any = new Error('Target employee not found');
    err.status = 404;
    throw err;
  }

  // 4. Verify target shift exists and is active
  const shift = await shiftDao.getShiftByCuid(validated.shift_cuid);
  if (!shift) {
    const err: any = new Error('Target shift not found');
    err.status = 404;
    throw err;
  }
  if (!shift.status) {
    const err: any = new Error('Cannot assign an inactive shift');
    err.status = 400;
    throw err;
  }

  // 5. Parse dates and check for overlaps (only if status is true)
  const fromUTC = parseDateUTC(validated.effective_from);
  const toUTC = validated.effective_to ? parseDateUTC(validated.effective_to) : null;

  // Validate against employee lifecycle (joining & relieving dates)
  const employment = await employmentDao.findByEmployeeCuid(validated.employee_cuid);
  if (employment) {
    const joiningDate = employment.date_of_joining ? parseDateUTC(employment.date_of_joining) : null;
    const relievingDate = employment.relieving_date ? parseDateUTC(employment.relieving_date) : null;

    if (joiningDate && fromUTC.getTime() < joiningDate.getTime()) {
      const err: any = new Error("Shift assignment effective from date cannot be before the employee's joining date.");
      err.status = 400;
      throw err;
    }

    if (toUTC && relievingDate && toUTC.getTime() > relievingDate.getTime()) {
      const err: any = new Error("Shift assignment effective to date cannot be after the employee's relieving date.");
      err.status = 400;
      throw err;
    }
  }

  if (validated.status) {
    const overlap = await shiftAssignmentDao.findOverlapping(validated.employee_cuid, fromUTC, toUTC);
    if (overlap) {
      const err: any = new Error('An active shift assignment already exists for this employee in the specified period');
      err.status = 409;
      throw err;
    }
  }

  const created = await db.$transaction(async (tx) => {
    const res = (tx && Object.keys(tx).length > 0)
      ? await shiftAssignmentDao.create({
          ...validated,
          effective_from: fromUTC,
          effective_to: toUTC
        }, tx)
      : await shiftAssignmentDao.create({
          ...validated,
          effective_from: fromUTC,
          effective_to: toUTC
        });

    await auditService.log({
      entity_name: 'ShiftAssignment',
      entity_cuid: res.cuid,
      action_type: 'create',
      status: 'SUCCESS',
    }, tx);

    return res;
  });

  // Trigger shift assigned notification
  if (created.status) {
    const { manager } = await getManagerSubordinates(managerEmail);
    notificationFactory.shiftAssigned(shift.name, fromUTC, validated.employee_cuid, manager.cuid)
      .catch((err) => console.error('Failed to trigger shift assigned notification:', err));
  }

  return created;
}

/**
 * Update an existing shift assignment.
 */
export async function updateAssignment(
  cuid: string,
  payload: unknown,
  managerEmail: string
): Promise<ShiftAssignment> {
  // 1. Validate payload structure
  const validated = validateUpdatePayload(payload);

  // 2. Fetch existing assignment and authorize
  const existing = await shiftAssignmentDao.findByCuid(cuid);
  if (!existing) {
    const err: any = new Error('Shift assignment not found');
    err.status = 404;
    throw err;
  }

  const { subordinates } = await getManagerSubordinates(managerEmail);
  const subordinateCuids = new Set(subordinates.map((s: any) => s.employee_cuid));

  if (!subordinateCuids.has(existing.employee_cuid)) {
    const err: any = new Error('Unauthorized: Assignment belongs to an employee who is not your direct report');
    err.status = 403;
    throw err;
  }

  // 3. If employee is changing, authorize the new target employee
  const targetEmployeeCuid = validated.employee_cuid ?? existing.employee_cuid;
  if (validated.employee_cuid !== undefined && !subordinateCuids.has(validated.employee_cuid)) {
    const err: any = new Error('Unauthorized: You can only assign shifts to your reporting direct subordinates');
    err.status = 403;
    throw err;
  }

  // 4. Verify target shift if changing
  const targetShiftCuid = validated.shift_cuid ?? existing.shift_cuid;
  if (validated.shift_cuid !== undefined) {
    const shift = await shiftDao.getShiftByCuid(validated.shift_cuid);
    if (!shift) {
      const err: any = new Error('Target shift not found');
      err.status = 404;
      throw err;
    }
    if (!shift.status) {
      const err: any = new Error('Cannot assign an inactive shift');
      err.status = 400;
      throw err;
    }
  }

  // 5. Build and validate merged dates
  const fromStr = validated.effective_from !== undefined ? validated.effective_from : existing.effective_from;
  const toStr = validated.effective_to !== undefined ? validated.effective_to : existing.effective_to;

  const fromUTC = parseDateUTC(fromStr);
  const toUTC = toStr ? parseDateUTC(toStr) : null;

  if (toUTC && toUTC.getTime() < fromUTC.getTime()) {
    const err: any = new Error('Effective To date must be greater than or equal to Effective From date');
    err.status = 400;
    throw err;
  }

  // Validate against employee lifecycle (joining & relieving dates)
  const employment = await employmentDao.findByEmployeeCuid(targetEmployeeCuid);
  if (employment) {
    const joiningDate = employment.date_of_joining ? parseDateUTC(employment.date_of_joining) : null;
    const relievingDate = employment.relieving_date ? parseDateUTC(employment.relieving_date) : null;

    if (joiningDate && fromUTC.getTime() < joiningDate.getTime()) {
      const err: any = new Error("Shift assignment effective from date cannot be before the employee's joining date.");
      err.status = 400;
      throw err;
    }

    if (toUTC && relievingDate && toUTC.getTime() > relievingDate.getTime()) {
      const err: any = new Error("Shift assignment effective to date cannot be after the employee's relieving date.");
      err.status = 400;
      throw err;
    }
  }

  // 6. Check for overlaps if status is active (either already active or turning active)
  const targetStatus = validated.status !== undefined ? validated.status : existing.status;
  if (targetStatus) {
    const overlap = await shiftAssignmentDao.findOverlapping(
      targetEmployeeCuid,
      fromUTC,
      toUTC,
      cuid
    );
    if (overlap) {
      const err: any = new Error('An active shift assignment already exists for this employee in the specified period');
      err.status = 409;
      throw err;
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const res = (tx && Object.keys(tx).length > 0)
      ? await shiftAssignmentDao.update(cuid, {
          employee_cuid: targetEmployeeCuid,
          shift_cuid: targetShiftCuid,
          effective_from: fromUTC,
          effective_to: toUTC,
          status: targetStatus,
          updated_by: validated.updated_by
        }, tx)
      : await shiftAssignmentDao.update(cuid, {
          employee_cuid: targetEmployeeCuid,
          shift_cuid: targetShiftCuid,
          effective_from: fromUTC,
          effective_to: toUTC,
          status: targetStatus,
          updated_by: validated.updated_by
        });

    await auditService.logUpdate({
      entityName: 'ShiftAssignment',
      entityCuid: cuid,
      oldRecord: existing,
      newRecord: res
    }, tx);

    return res;
  });

  const shiftChanged = targetShiftCuid !== existing.shift_cuid;
  const employeeChanged = targetEmployeeCuid !== existing.employee_cuid;
  const fromDateChanged = fromUTC.getTime() !== new Date(existing.effective_from).getTime();
  const statusActivated = targetStatus && !existing.status;

  if (updated.status && (shiftChanged || employeeChanged || fromDateChanged || statusActivated)) {
    const shift = await shiftDao.getShiftByCuid(targetShiftCuid);
    const shiftName = shift?.name || 'Assigned Shift';
    const { manager } = await getManagerSubordinates(managerEmail);

    if (employeeChanged) {
      notificationFactory.shiftAssigned(shiftName, fromUTC, targetEmployeeCuid, manager.cuid)
        .catch((err) => console.error('Failed to trigger shift assigned notification for new employee:', err));
    } else {
      notificationFactory.shiftReassigned(shiftName, fromUTC, targetEmployeeCuid, manager.cuid)
        .catch((err) => console.error('Failed to trigger shift reassigned notification:', err));
    }
  }

  return updated;
}

/**
 * Delete a shift assignment.
 */
export async function deleteAssignment(cuid: string, managerEmail: string): Promise<void> {
  const existing = await shiftAssignmentDao.findByCuid(cuid);
  if (!existing) {
    const err: any = new Error('Shift assignment not found');
    err.status = 404;
    throw err;
  }

  const { subordinates } = await getManagerSubordinates(managerEmail);
  const subordinateCuids = new Set(subordinates.map((s: any) => s.employee_cuid));

  if (!subordinateCuids.has(existing.employee_cuid)) {
    const err: any = new Error('Unauthorized: Assignment belongs to an employee who is not your direct report');
    err.status = 403;
    throw err;
  }

  await db.$transaction(async (tx) => {
    if (tx && Object.keys(tx).length > 0) {
      await shiftAssignmentDao.deleteAssignment(cuid, tx);
    } else {
      await shiftAssignmentDao.deleteAssignment(cuid);
    }
    await auditService.log({
      entity_name: 'ShiftAssignment',
      entity_cuid: cuid,
      action_type: 'delete',
      status: 'SUCCESS',
    }, tx);
  });
}
