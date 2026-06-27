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
		vi.mocked(db.settings.create).mockResolvedValue({ id: 1n, cuid: 's1', payroll_cutoff: 25, name: 'payroll_cutoff', configuration: { payroll_cut_off_date: 25 }, created_at: new Date(), updated_at: new Date() } as any);

		const settings = await settingsDao.getSettings();
		expect(settings.payroll_cutoff).toBe(25);
		
		// Assert getSettings tries finding with name first, then falls back without name filter
		expect(db.settings.findFirst).toHaveBeenNthCalledWith(1, {
			where: { name: 'payroll_cutoff' },
			orderBy: [
				{ created_at: 'desc' },
				{ id: 'desc' }
			]
		});
		expect(db.settings.findFirst).toHaveBeenNthCalledWith(2, {
			orderBy: [
				{ created_at: 'desc' },
				{ id: 'desc' }
			]
		});
		expect(db.settings.create).toHaveBeenCalledWith({
			data: {
				payroll_cutoff: 25,
				name: 'payroll_cutoff',
				configuration: { payroll_cut_off_date: 25 }
			}
		});
	});

	it('should getSettings - return existing latest setting if exists', async () => {
		const mockSetting = { id: 2n, cuid: 's2', payroll_cutoff: 20, name: 'payroll_cutoff', configuration: { payroll_cut_off_date: 20 }, created_at: new Date(), updated_at: new Date() };
		vi.mocked(db.settings.findFirst).mockResolvedValue(mockSetting as any);

		const settings = await settingsDao.getSettings();
		expect(settings.payroll_cutoff).toBe(20);
		expect(db.settings.findFirst).toHaveBeenCalledWith({
			where: { name: 'payroll_cutoff' },
			orderBy: [
				{ created_at: 'desc' },
				{ id: 'desc' }
			]
		});
		expect(db.settings.create).not.toHaveBeenCalled();
	});

	it('should updateSettings - always create a new record preserving history', async () => {
		vi.mocked(db.settings.create).mockResolvedValue({ id: 3n, cuid: 's3', payroll_cutoff: 15, name: 'payroll_cutoff', configuration: { payroll_cut_off_date: 15 }, created_at: new Date(), updated_at: new Date() } as any);

		const newSetting = await settingsDao.updateSettings(15, 'user-123');
		expect(newSetting.payroll_cutoff).toBe(15);
		expect(db.settings.create).toHaveBeenCalledWith({
			data: {
				payroll_cutoff: 15,
				name: 'payroll_cutoff',
				configuration: { payroll_cut_off_date: 15 },
				created_by: 'user-123',
				updated_by: 'user-123'
			}
		});
		expect(db.settings.update).not.toHaveBeenCalled();
	});

	it('should getSettingByName - query setting by name', async () => {
		const mockSetting = { id: 4n, cuid: 's4', name: 'attendance_settings', configuration: { test: true }, created_at: new Date(), updated_at: new Date() };
		vi.mocked(db.settings.findFirst).mockResolvedValue(mockSetting as any);

		const settings = await settingsDao.getSettingByName('attendance_settings');
		expect(settings).toBeDefined();
		expect(settings?.name).toBe('attendance_settings');
		expect(db.settings.findFirst).toHaveBeenCalledWith({
			where: { name: 'attendance_settings' },
			orderBy: [
				{ created_at: 'desc' },
				{ id: 'desc' }
			]
		});
	});

	it('should saveSetting - save a generic setting', async () => {
		vi.mocked(db.settings.create).mockResolvedValue({ id: 5n, cuid: 's5', name: 'leave_settings', configuration: { max_days: 10 }, created_at: new Date(), updated_at: new Date() } as any);

		const result = await settingsDao.saveSetting('leave_settings', { max_days: 10 }, 'user-456');
		expect(result.name).toBe('leave_settings');
		expect(db.settings.create).toHaveBeenCalledWith({
			data: {
				name: 'leave_settings',
				configuration: { max_days: 10 },
				payroll_cutoff: null,
				created_by: 'user-456',
				updated_by: 'user-456'
			}
		});
	});

	it('should saveSetting - sync payroll_cutoff column if saving payroll_cutoff setting', async () => {
		vi.mocked(db.settings.create).mockResolvedValue({ id: 6n, cuid: 's6', name: 'payroll_cutoff', configuration: { payroll_cut_off_date: 10 }, payroll_cutoff: 10, created_at: new Date(), updated_at: new Date() } as any);

		const result = await settingsDao.saveSetting('payroll_cutoff', { payroll_cut_off_date: 10 }, 'user-789');
		expect(result.payroll_cutoff).toBe(10);
		expect(db.settings.create).toHaveBeenCalledWith({
			data: {
				name: 'payroll_cutoff',
				configuration: { payroll_cut_off_date: 10 },
				payroll_cutoff: 10,
				created_by: 'user-789',
				updated_by: 'user-789'
			}
		});
	});
});
