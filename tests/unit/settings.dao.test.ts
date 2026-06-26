import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as settingsDao from '../../src/lib/server/dao/settings.dao.js';
import { db } from '../../src/lib/server/db.js';

vi.mock('$lib/server/db.js', () => {
	const mockDb = {
		settings: {
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn()
		}
	};
	return { db: mockDb };
});

describe('Settings DAO Unit Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should getSettings - return default if none exists', async () => {
		vi.mocked(db.settings.findFirst).mockResolvedValue(null);
		vi.mocked(db.settings.create).mockResolvedValue({ id: 1n, cuid: 's1', payroll_cutoff: 25, created_at: new Date(), updated_at: new Date() } as any);

		const settings = await settingsDao.getSettings();
		expect(settings.payroll_cutoff).toBe(25);
		expect(db.settings.findFirst).toHaveBeenCalledWith({
			orderBy: [
				{ created_at: 'desc' },
				{ id: 'desc' }
			]
		});
		expect(db.settings.create).toHaveBeenCalledWith({
			data: { payroll_cutoff: 25 }
		});
	});

	it('should getSettings - return existing latest setting if exists', async () => {
		const mockSetting = { id: 2n, cuid: 's2', payroll_cutoff: 20, created_at: new Date(), updated_at: new Date() };
		vi.mocked(db.settings.findFirst).mockResolvedValue(mockSetting as any);

		const settings = await settingsDao.getSettings();
		expect(settings.payroll_cutoff).toBe(20);
		expect(db.settings.findFirst).toHaveBeenCalledWith({
			orderBy: [
				{ created_at: 'desc' },
				{ id: 'desc' }
			]
		});
		expect(db.settings.create).not.toHaveBeenCalled();
	});

	it('should updateSettings - always create a new record preserving history', async () => {
		vi.mocked(db.settings.create).mockResolvedValue({ id: 3n, cuid: 's3', payroll_cutoff: 15, created_at: new Date(), updated_at: new Date() } as any);

		const newSetting = await settingsDao.updateSettings(15, 'user-123');
		expect(newSetting.payroll_cutoff).toBe(15);
		expect(db.settings.create).toHaveBeenCalledWith({
			data: {
				payroll_cutoff: 15,
				created_by: 'user-123',
				updated_by: 'user-123'
			}
		});
		expect(db.settings.update).not.toHaveBeenCalled();
	});
});
