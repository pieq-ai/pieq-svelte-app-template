import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '$lib/generated/prisma/client.js';

let prisma: PrismaClient | undefined;

function createClient(): PrismaClient {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL is not set');
	}

	const adapter = new PrismaPg({ connectionString });
	return new PrismaClient({ adapter });
}

function isValidClient(client: PrismaClient | undefined): client is PrismaClient {
	return Boolean(client?.leaveType && client?.salaryComponent);
}

function getDb(): PrismaClient {
	const cached = prisma ?? globalThis.__db;

	if (isValidClient(cached)) {
		prisma = cached;
		return cached;
	}

	prisma = createClient();

	if (process.env.NODE_ENV !== 'production') {
		globalThis.__db = prisma;
	}

	return prisma;
}

export const db = new Proxy({} as PrismaClient, {
	get(_target, prop) {
		const client = getDb();
		const value = client[prop as keyof PrismaClient];

		return typeof value === 'function' ? value.bind(client) : value;
	}
});
