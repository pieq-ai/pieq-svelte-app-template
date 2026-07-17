import { db } from '$lib/server/db.js';
import type { CreateNotificationDto } from './notification.service.js';

export interface TargetDescriptor {
	type: 'broadcast' | 'employee' | 'role' | 'department' | 'custom';
	employeeCuid?: string;
	roleCuid?: string;
	departmentCuid?: string;
	/**
	 * Used with type === 'custom'.
	 * A pre-resolved list of employee CUIDs supplied by the caller (typically the Notification Factory).
	 * The resolver validates each CUID against active employees and deduplicates the result.
	 */
	employeeCuids?: string[];
}

/**
 * Resolves a target descriptor into a deduplicated list of active employee CUIDs.
 *
 * Target types:
 *   - 'broadcast'  → all active (non-deleted) employees
 *   - 'employee'   → a single specific employee
 *   - 'custom'     → caller-supplied list of CUIDs (validated against active employees)
 *   - 'role' / 'department' → fall back to broadcast for Phase 1;
 *                             will be narrowed when RBAC is implemented in Phase 2
 */
export async function resolveRecipients(dto: CreateNotificationDto): Promise<string[]> {
	const target = dto.target;

	// Phase 1 Payroll Failure Override:
	// If it is a failed payroll notification (category === 'payroll' and type === 'error')
	// and target is broadcast, route only to the creator of the payroll upload.
	// In Phase 2, this rule can easily be updated here to target HR/Admin roles without changing templates/factory.
	if (dto.category === 'payroll' && dto.type === 'error' && target.type === 'broadcast') {
		if (dto.created_by) {
			const emp = await db.employee.findFirst({
				where: {
					cuid: dto.created_by,
					is_deleted: false
				},
				select: {
					cuid: true
				}
			});
			return emp ? [emp.cuid] : [];
		}
		return [];
	}

	// Single employee — direct lookup
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

	// Custom list — validate each CUID and return deduplicated active subset
	if (target.type === 'custom' && target.employeeCuids && target.employeeCuids.length > 0) {
		const uniqueCuids = [...new Set(target.employeeCuids)];
		const activeEmployees = await db.employee.findMany({
			where: {
				cuid: { in: uniqueCuids },
				is_deleted: false
			},
			select: {
				cuid: true
			}
		});
		return activeEmployees.map((e) => e.cuid);
	}

	// Broadcast, role, department — Phase 1: all active employees.
	// Role and department will be narrowed to their respective member sets in Phase 2 (RBAC).
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
