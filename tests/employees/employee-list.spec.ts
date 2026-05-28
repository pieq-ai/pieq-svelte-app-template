import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth-helper';
import { createTestEmployee } from '../fixtures/test-data';

test.describe.skip('Employee List UI', () => {
  let employee: any;

  test.beforeAll(async () => {
    employee = await createTestEmployee();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/employees');
  });

  test('should render the employee list table and load seeded employee', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Employee Directory/i })).toBeVisible();

    // The table should contain the employee we seeded
    await expect(page.getByText(employee.first_name)).toBeVisible();
    await expect(page.getByText(employee.last_name)).toBeVisible();
    await expect(page.getByText(employee.emp_code)).toBeVisible();
  });

  test('search filter should work', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill(employee.emp_code);

    // Should still see the employee
    await expect(page.getByText(employee.first_name)).toBeVisible();

    // Type something that doesn't exist
    await searchInput.fill('NONEXISTENT_EMPLOYEE_CODE');
    await expect(page.getByText(employee.first_name)).toBeHidden();
  });
});
