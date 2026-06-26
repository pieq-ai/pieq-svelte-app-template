// src/routes/shift-assignments/+page.server.ts
import { redirect } from '@sveltejs/kit';
import * as shiftAssignmentService from '$lib/server/services/shift-assignment.service.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';
import * as shiftDao from '$lib/server/dao/shift.dao.js';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';
import { db } from '$lib/server/db.js';
import { _mapShiftAssignment } from '../api/shift-assignments/+server.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  permissionGuard.requireAuth(locals.user);
  const email = locals.user?.email || '';

  let subordinatesList: any[] = [];
  try {
    const { subordinates } = await shiftAssignmentService.getManagerSubordinates(email);
    subordinatesList = subordinates;
  } catch (err) {
    throw redirect(303, '/dashboard');
  }

  // Enforce manager check
  if (subordinatesList.length === 0) {
    throw redirect(303, '/dashboard');
  }

  // Load employee names and codes for direct subordinates
  const subordinateCuids = subordinatesList.map((s) => s.employee_cuid);
  const subordinateEmployees = await employeeDao.getEmployeesByCuids(subordinateCuids);
  const subordinateEmployments = await db.employment.findMany({
    where: { employee_cuid: { in: subordinateCuids } }
  });

  const employeeOptions = subordinateEmployees.map((e: any) => {
    const emp = subordinateEmployments.find((emp) => emp.employee_cuid === e.cuid);
    return {
      id: e.cuid,
      label: `${e.emp_code} - ${e.first_name} ${e.last_name}`,
      joiningDate: emp?.date_of_joining ? emp.date_of_joining.toISOString().split('T')[0] : null,
      relievingDate: emp?.relieving_date ? emp.relieving_date.toISOString().split('T')[0] : null
    };
  });

  // Load active shifts from the Shift Master
  const activeShifts = await shiftDao.getShifts();
  const shiftOptions = activeShifts.map((s: any) => ({
    id: s.cuid,
    label: s.name
  }));

  // Load existing assignments
  const assignments = await shiftAssignmentService.listAssignments(email);
  const formattedAssignments = assignments.map(_mapShiftAssignment);

  return {
    employeeOptions,
    shiftOptions,
    assignments: formattedAssignments
  };
};
