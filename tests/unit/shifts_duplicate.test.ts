import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as shiftService from '../../src/lib/server/services/shift.service.js';
import { db } from '../../src/lib/server/db.js';

describe('Shift Timing Duplicate Prevention Integration Tests', () => {
  const activeShiftName1 = 'Test Unique Active One';
  const activeShiftName2 = 'Test Unique Active Two';
  const inactiveShiftName1 = 'Test Unique Inactive One';
  const inactiveShiftName2 = 'Test Unique Inactive Two';

  let cuid1 = '';
  let cuid2 = '';
  let cuid3 = '';
  let cuid4 = '';

  beforeAll(async () => {
    // 1. Cleanup existing test data if any
    await db.shift.deleteMany({
      where: {
        name: {
          in: [
            activeShiftName1,
            activeShiftName2,
            inactiveShiftName1,
            inactiveShiftName2
          ]
        }
      }
    });
  });

  afterAll(async () => {
    // 2. Clean up test records
    await db.shift.deleteMany({
      where: {
        cuid: {
          in: [cuid1, cuid2, cuid3, cuid4].filter(Boolean)
        }
      }
    });
  });

  it('1. Should allow creating a unique active shift', async () => {
    const shift = await shiftService.createShift({
      name: activeShiftName1,
      start_time: '1970-01-01T06:30:00.000Z',
      end_time: '1970-01-01T15:30:00.000Z',
      minimum_work_hours: 9
    });

    expect(shift).toBeDefined();
    expect(shift.name).toBe(activeShiftName1);
    expect(shift.status).toBe(true);
    cuid1 = shift.cuid;
  });

  it('2. Should reject creating a duplicate timing active shift (409)', async () => {
    await expect(
      shiftService.createShift({
        name: activeShiftName2,
        start_time: '1970-01-01T06:30:00.000Z',
        end_time: '1970-01-01T15:30:00.000Z',
        minimum_work_hours: 9
      })
    ).rejects.toThrow('Shift timing range already exists');
  });

  it('3. Should allow editing an active shift without changing its own timing range', async () => {
    const updated = await shiftService.updateShift(cuid1, {
      minimum_work_hours: 8.5
    });

    expect(Number(updated.minimum_work_hours)).toBe(8.5);
  });

  it('4. Should allow duplicate timing range on inactive shifts', async () => {
    // Create first shift with a unique active timing range initially
    const shift3 = await shiftService.createShift({
      name: inactiveShiftName1,
      start_time: '1970-01-01T12:00:00.000Z',
      end_time: '1970-01-01T21:00:00.000Z',
      minimum_work_hours: 9
    });
    cuid3 = shift3.cuid;

    // Deactivate it to make it inactive
    const deactivated1 = await shiftService.deleteShift(cuid3);
    expect(deactivated1.status).toBe(false);

    // Update its timing range to duplicate activeShiftName1 (06:30-15:30)
    // This must succeed because duplicate timing ranges are fully allowed on inactive shifts!
    const updatedInactive1 = await shiftService.updateShift(cuid3, {
      start_time: '1970-01-01T06:30:00.000Z',
      end_time: '1970-01-01T15:30:00.000Z'
    });
    expect(updatedInactive1.status).toBe(false);

    // Create second shift with unique active timing range initially
    const shift4 = await shiftService.createShift({
      name: inactiveShiftName2,
      start_time: '1970-01-01T12:00:00.000Z',
      end_time: '1970-01-01T21:00:00.000Z',
      minimum_work_hours: 9
    });
    cuid4 = shift4.cuid;

    // Deactivate it to make it inactive
    const deactivated2 = await shiftService.deleteShift(cuid4);
    expect(deactivated2.status).toBe(false);

    // Update its timing range to duplicate activeShiftName1 (06:30-15:30)
    // This must also succeed because duplicate timing ranges are fully allowed on inactive shifts!
    const updatedInactive2 = await shiftService.updateShift(cuid4, {
      start_time: '1970-01-01T06:30:00.000Z',
      end_time: '1970-01-01T15:30:00.000Z'
    });
    expect(updatedInactive2.status).toBe(false);
  });

  it('5. Should reject activation of an inactive shift if a timing conflict exists with an active shift (409)', async () => {
    // cuid3 now has timing 06:30-15:30 and status inactive.
    // cuid1 has timing 06:30-15:30 and status active.
    // Activating cuid3 must fail because of timing conflict with cuid1.
    await expect(
      shiftService.activateShift(cuid3)
    ).rejects.toThrow('Shift timing range already exists');
  });

  it('6. Should reject updating an inactive shift to active status if timing conflict exists (409)', async () => {
    // Updating cuid3 status to true directly must also fail because of timing conflict with cuid1.
    await expect(
      shiftService.updateShift(cuid3, { status: true })
    ).rejects.toThrow('Shift timing range already exists');
  });
});
