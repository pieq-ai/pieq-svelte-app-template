import { db } from '$lib/server/db.js';

export interface CreateLeaveTypeData {
	name: string;
	code: string;
	description?: string | null;
	is_paid: boolean;
	requires_approval: boolean;
	status: boolean;
	created_by?: string | null;
	updated_by?: string | null;
}

export async function list() {
	return db.leaveType.findMany({
		select: {
			cuid: true,
			name: true,
			code: true,
			description: true,
			is_paid: true,
			requires_approval: true,
			status: true
		},
		orderBy: { updated_at: 'desc' }
	});
}

export async function create(data: CreateLeaveTypeData) {
	return db.leaveType.create({
		data
	});
}

export async function update(cuid: string, data: Partial<CreateLeaveTypeData>) {
	return db.$transaction(async (tx) => {
		const updatedType = await tx.leaveType.update({
			where: { cuid },
			data
		});

		if (data.status !== undefined) {
			if (data.status === false) {
				await tx.leavePolicy.updateMany({
					where: {
						leave_type_cuid: cuid,
						status: true
					},
					data: {
						status: false,
						deactivated_by_leave_type: true
					}
				});
			} else {
				await tx.leavePolicy.updateMany({
					where: {
						leave_type_cuid: cuid,
						deactivated_by_leave_type: true
					},
					data: {
						status: true,
						deactivated_by_leave_type: false
					}
				});
			}
		}

		return updatedType;
	});
}

export async function findByCuid(cuid: string) {
	return db.leaveType.findUnique({
		where: { cuid },
		select: {
			cuid: true,
			name: true,
			code: true,
			description: true,
			is_paid: true,
			requires_approval: true,
			status: true
		}
	});
}

export async function findByName(leave_name: string) {
	return db.leaveType.findFirst({
		where: {
			name: {
				equals: leave_name,
				mode: 'insensitive'
			}
		}
	});
}

export async function findByCode(leave_code: string) {
	return db.leaveType.findFirst({
		where: {
			code: {
				equals: leave_code,
				mode: 'insensitive'
			}
		}
	});
}

export async function findDuplicateName(leave_name: string, excludeCuid: string) {
	return db.leaveType.findFirst({
		where: {
			name: {
				equals: leave_name,
				mode: 'insensitive'
			},
			NOT: { cuid: excludeCuid }
		}
	});
}

export async function findDuplicateCode(leave_code: string, excludeCuid: string) {
	return db.leaveType.findFirst({
		where: {
			code: {
				equals: leave_code,
				mode: 'insensitive'
			},
			NOT: { cuid: excludeCuid }
		}
	});
}
