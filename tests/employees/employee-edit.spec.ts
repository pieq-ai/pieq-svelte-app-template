import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth-helper';
import { createTestEmployee } from '../fixtures/test-data';
import { fillInput, submitModalForm, expectToast } from '../utils/crud-helper';

test.describe.skip('Employee Edit Flow', () => {
  let employee: any;

  test.beforeAll(async () => {
    employee = await createTestEmployee();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/employees');
  });

  test('successfully edits an existing employee', async ({ page }) => {
    // Find the specific employee row and click edit
    // Note: Assuming a standard table structure with an edit button in the actions column
    const row = page.getByRole('row').filter({ hasText: employee.first_name });
    await row.getByRole('button', { name: /Edit/i }).click();

    await expect(page.getByRole('dialog', { name: /Edit/i })).toBeVisible();

    // Update name
    await fillInput(page, /First Name/i, 'UpdatedName');
    
    await submitModalForm(page, 'Save Changes');

    await expectToast(page, /updated successfully/i);

    // Verify in table
    await expect(page.getByText('UpdatedName')).toBeVisible();
  });
});
