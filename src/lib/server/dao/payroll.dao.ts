import { db } from '$lib/server/db.js';
import type { CreatePayrollDto } from '$lib/types/payroll.js';

// ─── Single record queries ─────────────────────────────────────────────────────

/** Create a new payroll record. */
export async function create(data: CreatePayrollDto) {
	return db.payroll.create({
		data: {
			employee_cuid: data.employee_cuid,
			employee_code: data.employee_code,
			employee_name: data.employee_name,
			month: data.month,
			year: data.year,
			gross_earnings: data.gross_earnings,
			total_deduction: data.total_deduction,
			net_salary: data.net_salary,
			payroll_breakdown: data.payroll_breakdown,
			payroll_upload_cuid: data.payroll_upload_cuid ?? null,
			created_by: data.created_by ?? null
		}
	});
}

/** Find a payroll record by its external cuid. */
export async function findByCuid(cuid: string) {
	return db.payroll.findUnique({ where: { cuid } });
}

/** Check for an existing payroll record for the same employee+month+year. */
export async function findByEmployeeMonthYear(
	employee_cuid: string,
	month: number,
	year: number
) {
	return db.payroll.findUnique({
		where: { employee_cuid_month_year: { employee_cuid, month, year } }
	});
}

// ─── List queries ─────────────────────────────────────────────────────────────

/** Fetch all payroll records, most recent period first. */
export async function findMany() {
	return db.payroll.findMany({
		orderBy: [{ year: 'desc' }, { month: 'desc' }, { employee_code: 'asc' }]
	});
}

/** Fetch all payroll records belonging to a specific upload batch. */
export async function findManyByUploadCuid(payroll_upload_cuid: string) {
	return db.payroll.findMany({
		where: { payroll_upload_cuid },
		orderBy: [{ employee_code: 'asc' }]
	});
}
