// src/lib/server/dao/shift-assignment.dao.ts
import { db } from '$lib/server/db.js';
import type { ShiftAssignment, ShiftAssignmentCreateDTO, ShiftAssignmentUpdateDTO } from '$lib/types/shift-assignment';

/**
 * Helper to fetch and merge employee and shift information into assignments.
 */
async function resolveRelations(assignments: any[], client: any): Promise<ShiftAssignment[]> {
  if (assignments.length === 0) return [];

  const employeeCuids = Array.from(new Set(assignments.map((a) => a.employee_cuid)));
  const shiftCuids = Array.from(new Set(assignments.map((a) => a.shift_cuid)));

  const [employees, shifts] = await Promise.all([
    client.employee.findMany({
      where: { cuid: { in: employeeCuids } },
      select: { cuid: true, first_name: true, last_name: true, emp_code: true }
    }),
    client.shift.findMany({
      where: { cuid: { in: shiftCuids } },
      select: { cuid: true, shift_name: true, start_time: true, end_time: true }
    })
  ]);

  const employeeMap = new Map<string, any>(employees.map((e: any) => [e.cuid, e]));
  const shiftMap = new Map<string, any>(shifts.map((s: any) => [s.cuid, s]));

  return assignments.map((a) => {
    const emp = employeeMap.get(a.employee_cuid);
    const sh = shiftMap.get(a.shift_cuid);

    return {
      cuid: a.cuid,
      employee_cuid: a.employee_cuid,
      shift_cuid: a.shift_cuid,
      effective_from: a.effective_from,
      effective_to: a.effective_to,
      status: a.status,
      created_by: a.created_by,
      updated_by: a.updated_by,
      created_at: a.created_at,
      updated_at: a.updated_at,
      employee: emp
        ? {
            first_name: emp.first_name,
            last_name: emp.last_name,
            emp_code: emp.emp_code
          }
        : undefined,
      shift: sh
        ? {
            shift_name: sh.shift_name,
            start_time: sh.start_time,
            end_time: sh.end_time
          }
        : undefined
    };
  });
}

/**
 * List all shift assignments for a list of employee CUIDs.
 */
export async function listForSubordinates(employeeCuids: string[], tx?: any): Promise<ShiftAssignment[]> {
  const client = tx || db;
  const assignments = await client.shiftAssignment.findMany({
    where: {
      employee_cuid: { in: employeeCuids }
    },
    orderBy: {
      effective_from: 'desc'
    }
  });

  return resolveRelations(assignments, client);
}

/**
 * Find a specific shift assignment by its CUID.
 */
export async function findByCuid(cuid: string, tx?: any): Promise<ShiftAssignment | null> {
  const client = tx || db;
  const assignment = await client.shiftAssignment.findUnique({
    where: { cuid }
  });

  if (!assignment) return null;

  const resolved = await resolveRelations([assignment], client);
  return resolved[0] || null;
}

/**
 * Create a new shift assignment.
 */
export async function create(data: ShiftAssignmentCreateDTO, tx?: any): Promise<ShiftAssignment> {
  const client = tx || db;
  const created = await client.shiftAssignment.create({
    data: {
      employee_cuid: data.employee_cuid,
      shift_cuid: data.shift_cuid,
      effective_from: data.effective_from,
      effective_to: data.effective_to,
      status: data.status ?? true,
      created_by: data.created_by ?? null,
      updated_by: data.updated_by ?? null
    }
  });

  const resolved = await resolveRelations([created], client);
  return resolved[0];
}

/**
 * Update an existing shift assignment.
 */
export async function update(
  cuid: string,
  data: ShiftAssignmentUpdateDTO,
  tx?: any
): Promise<ShiftAssignment> {
  const client = tx || db;
  const updated = await client.shiftAssignment.update({
    where: { cuid },
    data: {
      employee_cuid: data.employee_cuid,
      shift_cuid: data.shift_cuid,
      effective_from: data.effective_from,
      effective_to: data.effective_to,
      status: data.status,
      updated_by: data.updated_by
    }
  });

  const resolved = await resolveRelations([updated], client);
  return resolved[0];
}

/**
 * Delete a shift assignment.
 */
export async function deleteAssignment(cuid: string, tx?: any): Promise<void> {
  const client = tx || db;
  await client.shiftAssignment.delete({
    where: { cuid }
  });
}

/**
 * Check if there is an overlapping shift assignment for the employee.
 * Overlaps only occur when status is true.
 */
export async function findOverlapping(
  employeeCuid: string,
  start: Date,
  end: Date,
  excludeCuid?: string,
  tx?: any
): Promise<any | null> {
  const client = tx || db;
  return client.shiftAssignment.findFirst({
    where: {
      employee_cuid: employeeCuid,
      status: true,
      effective_from: { lte: end },
      effective_to: { gte: start },
      ...(excludeCuid ? { NOT: { cuid: excludeCuid } } : {})
    }
  });
}
