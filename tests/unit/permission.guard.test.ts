import { describe, test, expect } from 'vitest';
import { requirePermission, requireAdmin } from '$lib/server/guards/permission.guard.js';
import type { User } from '$lib/types/user';

describe('Permission Guard (Authentication-only)', () => {
	const testUser: User = {
		id: 'test-user-id',
		email: 'test@example.com',
		name: 'Test User'
	};

	test('should block unauthenticated user in requirePermission', async () => {
		await expect(requirePermission(null, [], 'salary_structure_view')).rejects.toThrow('Unauthorized');
	});

	test('should allow authenticated user in requirePermission', async () => {
		await expect(requirePermission(testUser, [], 'salary_structure_view')).resolves.not.toThrow();
	});

	test('should block unauthenticated user in requireAdmin', async () => {
		await expect(requireAdmin(null, [])).rejects.toThrow('Unauthorized');
	});

	test('should allow authenticated user in requireAdmin', async () => {
		await expect(requireAdmin(testUser, [])).resolves.not.toThrow();
	});
});
