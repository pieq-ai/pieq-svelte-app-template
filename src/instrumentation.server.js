import { db } from '$lib/server/db.js';

export async function register() {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	try {
		await db.$connect();
		console.info('[instrumentation] Database connection ready');
	} catch (err) {
		console.error('[instrumentation] Database connection failed', err);
	}
}
