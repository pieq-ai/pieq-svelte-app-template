import { db } from '$lib/server/db.js';

/**
 * Retrieves the settings record. If none exists, creates a default one.
 */
export async function getSettings(tx?: any) {
	const client = tx || db;
	let settings = await client.settings.findFirst();
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
 * Updates the settings record with the new payroll cutoff and audit user.
 */
export async function updateSettings(payrollCutoff: number, userId?: string | null, tx?: any) {
	const client = tx || db;
	const current = await getSettings(client);
	return client.settings.update({
		where: { cuid: current.cuid },
		data: {
			payroll_cutoff: payrollCutoff,
			updated_by: userId ?? undefined
		}
	});
}
