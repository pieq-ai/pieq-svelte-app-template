import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userDao from '$lib/server/dao/user.dao';
import * as userService from '$lib/server/services/user.service';

vi.mock('$lib/server/dao/user.dao', () => ({
	findById: vi.fn(),
	findByEmail: vi.fn(),
	upsert: vi.fn(),
	list: vi.fn()
}));

const mockUser = {
	id: 'kc-sub-123',
	email: 'user@example.com',
	name: 'Test User',
	createdAt: new Date('2024-01-15T00:00:00.000Z'),
	updatedAt: new Date('2024-01-15T00:00:00.000Z')
};

describe('user.service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('syncFromKeycloakProfile upserts a user from OIDC claims', async () => {
		vi.mocked(userDao.upsert).mockResolvedValue(mockUser);

		const result = await userService.syncFromKeycloakProfile({
			id: mockUser.id,
			email: mockUser.email,
			name: mockUser.name
		});

		expect(userDao.upsert).toHaveBeenCalledWith({
			id: mockUser.id,
			email: mockUser.email,
			name: mockUser.name
		});
		expect(result).toEqual(mockUser);
	});

	it('getById throws when user is missing', async () => {
		vi.mocked(userDao.findById).mockResolvedValue(null);

		await expect(userService.getById('missing')).rejects.toMatchObject({ status: 404 });
	});

	it('getDashboardContext aggregates user and role stats', async () => {
		vi.mocked(userDao.findById).mockResolvedValue(mockUser);

		const context = await userService.getDashboardContext(mockUser.id, ['admin', 'user']);

		expect(context.user).toEqual(mockUser);
		expect(context.roles).toEqual(['admin', 'user']);
		expect(context.stats.memberSince).toBe('2024-01-15');
		expect(context.stats.roleCount).toBe(2);
	});

	it('hasRole checks realm roles', () => {
		expect(userService.hasRole(['admin', 'user'], 'admin')).toBe(true);
		expect(userService.hasRole(['user'], 'admin')).toBe(false);
	});
});
