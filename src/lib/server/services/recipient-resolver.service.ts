import { db } from '$lib/server/db.js';

export interface TargetDescriptor {
	type: 'broadcast' | 'employee' | 'role' | 'department' | 'manager';
	employeeCuid?: string;
	roleCuid?: string;
	departmentCuid?: string;
}

/**
 * Resolves a target descriptor into a list of employee CUIDs.
 * Adheres to Phase 1 requirement: target types like broadcast, role, and department
 * fall back to targeting all active employees in the system.
 */
export async function resolveRecipients(target: TargetDescriptor): Promise<string[]> {
	if (target.type === 'employee' && target.employeeCuid) {
		const emp = await db.employee.findFirst({
			where: {
				cuid: target.employeeCuid,
				is_deleted: false
			},
			select: {
				cuid: true
			}
		});
		return emp ? [emp.cuid] : [];
	}

	// For Phase 1: All notifications (broadcast, employee-targeted, role-targeted, etc.) target all non-deleted employees.
	// This will be refactored to support selective targeting when RBAC is implemented in Phase 2.
	const activeEmployees = await db.employee.findMany({
		where: {
			is_deleted: false
		},
		select: {
			cuid: true
		}
	});

	return activeEmployees.map((e) => e.cuid);
}
