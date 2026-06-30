import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/lib/generated/prisma/client.ts';

dotenv.config();

async function main() {
	const connectionString = process.env.DATABASE_URL;
	const adapter = new PrismaPg({ connectionString });
	const prisma = new PrismaClient({ adapter });

	try {
		console.log('--- EMPLOYEES ---');
		const employees = await prisma.employee.findMany();
		for (const emp of employees) {
			console.log(`CUID: ${emp.cuid}, Code: ${emp.emp_code}, Name: ${emp.first_name} ${emp.last_name}, Gender: ${emp.gender}, Personal Email: ${emp.personal_email}`);
		}

		console.log('\n--- EMPLOYMENTS ---');
		const employments = await prisma.employment.findMany();
		for (const emp of employments) {
			console.log(`CUID: ${emp.cuid}, Employee CUID: ${emp.employee_cuid}, Manager CUID: ${emp.reporting_manager_cuid}, Joining: ${emp.date_of_joining?.toISOString().split('T')[0]}, Relieving: ${emp.relieving_date?.toISOString().split('T')[0] || 'N/A'}, Official Email: ${emp.official_email}`);
		}

		console.log('\n--- LEAVE TYPES ---');
		const leaveTypes = await prisma.leaveType.findMany();
		for (const lt of leaveTypes) {
			console.log(`CUID: ${lt.cuid}, Code: ${lt.code}, Name: ${lt.name}, Paid: ${lt.is_paid}`);
		}

		console.log('\n--- LEAVE POLICIES ---');
		const leavePolicies = await prisma.leavePolicy.findMany();
		for (const lp of leavePolicies) {
			console.log(`CUID: ${lp.cuid}, Leave Type CUID: ${lp.leave_type_cuid}, Annual Limit: ${lp.annual_limit}, Min Service Days: ${lp.min_service_days}, Allow Half Day: ${lp.allow_half_day}, Gender Specific: ${lp.gender_specific}, Gender: ${lp.applicable_gender}`);
		}

		console.log('\n--- LEAVE BALANCES ---');
		const balances = await prisma.leaveBalance.findMany();
		for (const b of balances) {
			console.log(`CUID: ${b.cuid}, Employee CUID: ${b.employee_cuid}, Leave Type CUID: ${b.leave_type_cuid}, Year: ${b.year}, Allocated: ${b.allocated_days}, Used: ${b.used_days}, Remaining: ${b.remaining_days}, Carried Forward: ${b.carried_forward_days}`);
		}

		console.log('\n--- LEAVE REQUESTS ---');
		const requests = await prisma.leaveRequest.findMany();
		for (const r of requests) {
			console.log(`CUID: ${r.cuid}, Employee CUID: ${r.employee_cuid}, Leave Type CUID: ${r.leave_type_cuid}, Dates: ${r.start_date.toISOString().split('T')[0]} to ${r.end_date.toISOString().split('T')[0]}, Total Days: ${r.total_days}, Status: ${r.request_status}, Days from Primary: ${r.days_from_primary}, LWP: ${r.days_from_lwp}, LOP: ${r.days_from_lop}`);
		}
	} catch (e) {
		console.error(e);
	} finally {
		await prisma.$disconnect();
	}
}

main();
