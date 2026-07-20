import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '$lib/generated/prisma/client.js';

const SCHEMA_VERSION = 'standardized-audit-fields-leave-mgmt';

declare global {
	var __db: PrismaClient | undefined;
	var __pgPool: pg.Pool | undefined;
	var __dbSchemaVersion: string | undefined;
}

function getPool(): pg.Pool {
	if (!globalThis.__pgPool) {
		const connectionString = process.env.DATABASE_URL;
		if (!connectionString) {
			throw new Error('DATABASE_URL is not set');
		}

		const pool = new pg.Pool({
			connectionString,
			max: parseInt(process.env.DB_POOL_MAX || '10', 10),
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 10000
		});

		pool.on('error', (err) => {
			console.error('[PG Pool Error]', err);
		});

		globalThis.__pgPool = pool;
	}

	return globalThis.__pgPool;
}

function createClient(): PrismaClient {
	const pool = getPool();
	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
}

function isValidClient(client: PrismaClient | undefined): client is PrismaClient {
	if (!client) return false;
	if (process.env.NODE_ENV === 'production') return true;
	return globalThis.__dbSchemaVersion === SCHEMA_VERSION;
}

function getDb(): PrismaClient {
	const cached = globalThis.__db;

	if (isValidClient(cached)) {
		return cached;
	}

	const client = createClient();
	globalThis.__db = client;
	globalThis.__dbSchemaVersion = SCHEMA_VERSION;

	return client;
}

export const db = new Proxy({} as PrismaClient, {
	get(_target, prop) {
		const client = getDb();
		const value = client[prop as keyof PrismaClient];

		return typeof value === 'function' ? value.bind(client) : value;
	}
});

// Graceful shutdown for AWS ECS Fargate container lifecycle
if (process.env.NODE_ENV === 'production') {
	const cleanup = async () => {
		if (globalThis.__db) {
			await globalThis.__db.$disconnect();
		}
		if (globalThis.__pgPool) {
			await globalThis.__pgPool.end();
		}
	};

	process.once('SIGINT', cleanup);
	process.once('SIGTERM', cleanup);
}
