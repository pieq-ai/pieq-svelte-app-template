import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth-helper';
import { createTestEmployee } from '../fixtures/test-data';
import { confirmDeleteModal, expectToast } from '../utils/crud-helper';

test.describe.skip('Employee Delete Flow', () => {
  let employee: any;

  test.beforeEach(async ({ page }) => {
    // We create a fresh one for each test so it can be safely deleted
    employee = await createTestEmployee();
    
    await loginAsAdmin(page);
    await page.goto('/employees');
  });

  test('successfully deletes/deactivates an employee', async ({ page }) => {
    const row = page.getByRole('row').filter({ hasText: employee.first_name });
    await row.getByRole('button', { name: /Deactivate/i }).click();

    await confirmDeleteModal(page);

    await expectToast(page, /deactivated successfully/i);

    // Depending on logic, it might disappear from default view or show as inactive badge
    // We can just check the toast here
  });
});
