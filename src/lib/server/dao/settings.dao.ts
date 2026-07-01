import { db } from '$lib/server/db.js';

/**
 * Retrieves the settings record. If none exists, throws an error.
 * Always returns the latest saved record (most recently created) for payroll_cutoff.
 */
export async function getSettings(tx?: any) {
	const client = tx || db;
	let settings = await client.settings.findFirst({
		where: { name: 'payroll_cutoff' },
		orderBy: [
			{ created_at: 'desc' },
			{ id: 'desc' }
		]
	});

	if (!settings) {
		// Fallback for pre-migration data or incomplete records
		settings = await client.settings.findFirst({
			orderBy: [
				{ created_at: 'desc' },
				{ id: 'desc' }
			]
		});
	}

	if (!settings) {
		throw new Error('Settings record for payroll_cutoff not found');
	}
	return settings;
}

/**
 * Updates the existing settings record with the new payroll cutoff.
 * This updates the configuration JSON object in the existing record rather than creating a new one.
 */
export async function updateSettings(payrollCutoff: number, userId?: string | null, tx?: any) {
	const client = tx || db;
	const latest = await getSettings(client);

	return client.settings.update({
		where: { cuid: latest.cuid },
		data: {
			payroll_cutoff: payrollCutoff,
			configuration: { payroll_cut_off_date: payrollCutoff },
			updated_by: userId ?? null
		}
	});
}

/**
 * Retrieves the latest settings record for a given setting name.
 */
export async function getSettingByName(name: string, tx?: any) {
	const client = tx || db;
	return client.settings.findFirst({
		where: { name },
		orderBy: [
			{ created_at: 'desc' },
			{ id: 'desc' }
		]
	});
}

/**
 * Creates/Updates a setting. Updates in-place if name is 'payroll_cutoff', otherwise creates a new record.
 */
export async function saveSetting(name: string, configuration: any, userId?: string | null, tx?: any) {
	const client = tx || db;
	if (name === 'payroll_cutoff') {
		const payrollCutoff = typeof configuration === 'object' && configuration !== null
			? (configuration.payroll_cut_off_date ?? null)
			: null;
		const latest = await getSettings(client);
		return client.settings.update({
			where: { cuid: latest.cuid },
			data: {
				configuration,
				payroll_cutoff: payrollCutoff,
				updated_by: userId ?? null
			}
		});
	}

	return client.settings.create({
		data: {
			name,
			configuration,
			created_by: userId ?? null,
			updated_by: userId ?? null
		}
	});
}

