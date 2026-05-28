import { db } from '$lib/server/db.js';

export interface CreateLeaveTypeData {
	leave_name: string;
	leave_code: string;
	description?: string | null;
	is_paid: boolean;
	requires_approval: boolean;
	status: boolean;
}

export async function list() {
	return db.leaveType.findMany({
		orderBy: { leave_name: 'asc' }
	});
}

export async function create(data: CreateLeaveTypeData) {
	return db.leaveType.create({
		data
	});
}

export async function update(cuid: string, data: Partial<CreateLeaveTypeData>) {
	return db.leaveType.update({
		where: { cuid },
		data
	});
}

export async function deleteLeaveType(cuid: string) {
	return db.leaveType.delete({
		where: { cuid }
	});
}

export async function findByCuid(cuid: string) {
	return db.leaveType.findUnique({
		where: { cuid }
	});
}

export async function findByName(leave_name: string) {
	return db.leaveType.findFirst({
		where: {
			leave_name: {
				equals: leave_name,
				mode: 'insensitive'
			}
		}
	});
}

export async function findByCode(leave_code: string) {
	return db.leaveType.findFirst({
		where: {
			leave_code: {
				equals: leave_code,
				mode: 'insensitive'
			}
		}
	});
}

export async function findDuplicateName(leave_name: string, excludeCuid: string) {
	return db.leaveType.findFirst({
		where: {
			leave_name: {
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
			leave_code: {
				equals: leave_code,
				mode: 'insensitive'
			},
			NOT: { cuid: excludeCuid }
		}
	});
}
