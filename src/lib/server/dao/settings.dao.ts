import { db } from '$lib/server/db.js';

/**
 * Retrieves the settings record. If none exists, creates a default one.
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
		settings = await client.settings.create({
			data: {
				payroll_cutoff: 25,
				name: 'payroll_cutoff',
				configuration: { payroll_cut_off_date: 25 }
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
			name: 'payroll_cutoff',
			configuration: { payroll_cut_off_date: payrollCutoff },
			created_by: userId ?? null,
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
 * Creates/Updates a setting by inserting a new record (preserving history).
 */
export async function saveSetting(name: string, configuration: any, userId?: string | null, tx?: any) {
	const client = tx || db;
	// Extract payroll_cutoff if this is the 'payroll_cutoff' setting to maintain backward compatibility
	const payrollCutoff = name === 'payroll_cutoff' && typeof configuration === 'object' && configuration !== null
		? (configuration.payroll_cut_off_date ?? 25)
		: null;

	return client.settings.create({
		data: {
			name,
			configuration,
			payroll_cutoff: payrollCutoff,
			created_by: userId ?? null,
			updated_by: userId ?? null
		}
	});
}

