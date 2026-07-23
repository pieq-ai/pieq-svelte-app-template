import { PrismaClient } from '../src/lib/generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createId } from '@paralleldrive/cuid2';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error('DATABASE_URL is not set');
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
	'attendance:view',
	'attendance_record:view',
	'audit:view',
	'dashboard:admin',
	'dashboard:employee',
	'dashboard:finance',
	'dashboard:manager',
	'dashboard:view',
	'department:view',
	'designation:view',
	'employee:view',
	'holiday:view',
	'leave:view',
	'leave_policy:view',
	'leave_type:view',
	'location:view',
	'payroll:view',
	'permission:view',
	'profile:view',
	'role:view',
	'role_permission:view',
	'salary_component:view',
	'salary_structure:view',
	'shift:view',
	'shift_assignment:view',
	'system_role:view'
];

async function main() {
	console.log('Seeding system permissions with dynamic CUID2s...');

	for (const key of PERMISSIONS) {
		let permission = await prisma.permissions.findUnique({
			where: { permission_key: key }
		});
		if (!permission) {
			permission = await prisma.permissions.create({
				data: {
					cuid: createId(),
					permission_key: key,
					status: true
				}
			});
			console.log(`Created permission: ${key} (${permission.cuid})`);
		} else {
			console.log(`Permission already exists: ${key} (${permission.cuid})`);
		}
	}

	console.log('Seeding completed successfully!');
}

main()
	.catch((e) => {
		console.error('Error during seeding:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
