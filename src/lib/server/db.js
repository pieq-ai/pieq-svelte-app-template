import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

/** @type {PrismaClient | undefined} */
let prisma;

/** @returns {PrismaClient} */
function createClient() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL is not set');
	}

	const adapter = new PrismaPg({ connectionString });
	return new PrismaClient({ adapter });
}

/** @returns {PrismaClient} */
function getDb() {
	if (prisma) {
		return prisma;
	}

	prisma = globalThis.__db ?? createClient();

	if (process.env.NODE_ENV !== 'production') {
		globalThis.__db = prisma;
	}

	return /** @type {PrismaClient} */ (prisma);
}

/** @type {PrismaClient} */
export const db = new Proxy(/** @type {PrismaClient} */ ({}), {
	get(_target, prop) {
		const client = getDb();
		const value = client[/** @type {keyof PrismaClient} */ (prop)];

		return typeof value === 'function' ? value.bind(client) : value;
	}
});
