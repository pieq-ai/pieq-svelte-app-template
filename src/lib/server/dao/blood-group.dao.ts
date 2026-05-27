import { db } from '$lib/server/db.js';

export interface CreateBloodGroupData {
	blood_group_name: string;
}

export async function list() {
	return db.bloodGroup.findMany({
		orderBy: { id: 'asc' }
	});
}

export async function create(data: CreateBloodGroupData) {
	return db.bloodGroup.create({
		data: {
			blood_group_name: data.blood_group_name
		}
	});
}

export async function update(uuid: string, data: Partial<CreateBloodGroupData>) {
	return db.bloodGroup.update({
		where: { uuid },
		data
	});
}

export async function deleteBloodGroup(uuid: string) {
	return db.bloodGroup.delete({
		where: { uuid }
	});
}

export async function findByUuid(uuid: string) {
	return db.bloodGroup.findUnique({
		where: { uuid }
	});
}

export async function findByName(blood_group_name: string) {
	return db.bloodGroup.findUnique({
		where: { blood_group_name }
	});
}

export async function findDuplicateExcludingUuid(blood_group_name: string, uuid: string) {
	return db.bloodGroup.findFirst({
		where: {
			blood_group_name,
			NOT: { uuid }
		}
	});
}
