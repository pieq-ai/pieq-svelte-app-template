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

	it('should getSettings - initialize if none exists', async () => {
		vi.mocked(db.settings.findFirst).mockResolvedValue(null);
		const mockCreated = { id: 1n, cuid: 's1', name: 'payroll_cutoff', configuration: { payroll_cut_off_date: 25 }, created_at: new Date(), updated_at: new Date() };
		vi.mocked(db.settings.create).mockResolvedValue(mockCreated as any);

		const result = await settingsDao.getSettings();
		expect(result).toEqual(mockCreated);
		
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
				name: 'payroll_cutoff',
				configuration: { payroll_cut_off_date: 25 }
			}
		});
	});

	it('should getSettings - return existing latest setting if exists', async () => {
		const mockSetting = { id: 2n, cuid: 's2', name: 'payroll_cutoff', configuration: { payroll_cut_off_date: 20 }, created_at: new Date(), updated_at: new Date() };
		vi.mocked(db.settings.findFirst).mockResolvedValue(mockSetting as any);

		const settings = await settingsDao.getSettings();
		expect(settings.configuration).toEqual({ payroll_cut_off_date: 20 });
		expect(db.settings.findFirst).toHaveBeenCalledWith({
			where: { name: 'payroll_cutoff' },
			orderBy: [
				{ created_at: 'desc' },
				{ id: 'desc' }
			]
		});
		expect(db.settings.create).not.toHaveBeenCalled();
	});

	it('should updateSettings - update the existing record', async () => {
		const mockSetting = { id: 3n, cuid: 's3', name: 'payroll_cutoff', configuration: { payroll_cut_off_date: 25 }, created_at: new Date(), updated_at: new Date() };
		vi.mocked(db.settings.findFirst).mockResolvedValue(mockSetting as any);
		vi.mocked(db.settings.update).mockResolvedValue({ ...mockSetting, configuration: { payroll_cut_off_date: 15 } } as any);

		const updatedSetting = await settingsDao.updateSettings(15, 'user-123');
		expect(updatedSetting.configuration).toEqual({ payroll_cut_off_date: 15 });
		expect(db.settings.update).toHaveBeenCalledWith({
			where: { cuid: 's3' },
			data: {
				configuration: { payroll_cut_off_date: 15 },
				updated_by: 'user-123'
			}
		});
		expect(db.settings.create).not.toHaveBeenCalled();
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
				created_by: 'user-456',
				updated_by: 'user-456'
			}
		});
	});

	it('should saveSetting - update configuration JSON for payroll_cutoff setting', async () => {
		const mockSetting = { id: 6n, cuid: 's6', name: 'payroll_cutoff', configuration: { payroll_cut_off_date: 25 }, created_at: new Date(), updated_at: new Date() };
		vi.mocked(db.settings.findFirst).mockResolvedValue(mockSetting as any);
		vi.mocked(db.settings.update).mockResolvedValue({ ...mockSetting, configuration: { payroll_cut_off_date: 10 } } as any);

		const result = await settingsDao.saveSetting('payroll_cutoff', { payroll_cut_off_date: 10 }, 'user-789');
		expect(result.configuration).toEqual({ payroll_cut_off_date: 10 });
		expect(db.settings.update).toHaveBeenCalledWith({
			where: { cuid: 's6' },
			data: {
				configuration: { payroll_cut_off_date: 10 },
				updated_by: 'user-789'
			}
		});
		expect(db.settings.create).not.toHaveBeenCalled();
	});
});
