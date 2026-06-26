import { db } from '$lib/server/db.js';

/**
 * Retrieves the settings record. If none exists, creates a default one.
 * Always returns the latest saved record (most recently created).
 */
export async function getSettings(tx?: any) {
	const client = tx || db;
	let settings = await client.settings.findFirst({
		orderBy: [
			{ created_at: 'desc' },
			{ id: 'desc' }
		]
	});
	if (!settings) {
		settings = await client.settings.create({
			data: {
				payroll_cutoff: 25
			}
		});
	}
	return settings;
}

/**
 * Creates a new settings record with the new payroll cutoff and audit user.
 * This preserves the complete history of payroll cutoff configurations.
 */
export async function updateSettings(payrollCutoff: number, userId?: string | null, tx?: any) {
	const client = tx || db;
	return client.settings.create({
		data: {
			payroll_cutoff: payrollCutoff,
			created_by: userId ?? null,
			updated_by: userId ?? null
		}
	});
}
