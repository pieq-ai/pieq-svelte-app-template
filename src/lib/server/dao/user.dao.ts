import { db } from '$lib/server/db.js';

export interface UpsertUserData {
	id: string;
	email: string;
	name?: string | null;
}

export function findById(id: string) {
	return db.user.findUnique({ where: { id } });
}

export function findByEmail(email: string) {
	return db.user.findUnique({ where: { email } });
}

export function upsert(data: UpsertUserData) {
	return db.user.upsert({
		where: { id: data.id },
		create: {
			id: data.id,
			email: data.email,
			name: data.name ?? null
		},
		update: {
			email: data.email,
			name: data.name ?? null
		}
	});
}

export function list(limit = 50) {
	return db.user.findMany({
		take: limit,
		orderBy: { createdAt: 'desc' }
	});
}
