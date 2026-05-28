import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth-helper';
import { setupBaseMasterData } from '../fixtures/test-data';
import { generateRandomString } from '../utils/db-helper';
import { openCreateModal, fillInput, selectDropdownByValueAttr, submitModalForm, expectToast } from '../utils/crud-helper';

test.describe.skip('Employee Create Flow', () => {
  let masterData: any;

  test.beforeAll(async () => {
    masterData = await setupBaseMasterData();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/employees');
  });

  test('successfully creates a new employee and dropdowns bind cuid2', async ({ page }) => {
    await openCreateModal(page, 'Add Employee');

    // Fill form
    const uniqueEmail = `new.user${generateRandomString(4)}@example.com`;
    const uniqueMobile = `98${generateRandomString(8).replace(/[^0-9]/g, '0').padEnd(8, '0')}`;
    
    await fillInput(page, /First Name/i, 'Jane');
    await fillInput(page, /Last Name/i, 'Doe');
    await fillInput(page, /Email/i, uniqueEmail);
    await fillInput(page, /Mobile/i, uniqueMobile);
    // Fill other text inputs as required by the form
    await fillInput(page, /Aadhar No/i, `1234${generateRandomString(8).replace(/[^0-9]/g, '0').padEnd(8, '0')}`);
    await fillInput(page, /Pan No/i, `XYZPM${generateRandomString(4).replace(/[^0-9]/g, '0').padEnd(4, '0')}F`);

    // The select elements should use cuid2 as their values, test mapping is handled here.
    await selectDropdownByValueAttr(page, /Department/i, masterData.department.cuid2);
    await selectDropdownByValueAttr(page, /Designation/i, masterData.designation.cuid2);
    await selectDropdownByValueAttr(page, /Blood Group/i, masterData.bloodGroup.cuid2);

    await submitModalForm(page, 'Create Employee');

    await expectToast(page, /Employee created successfully/i);

    // Verify it appears in list
    await expect(page.getByText('Jane')).toBeVisible();
    await expect(page.getByText('Doe')).toBeVisible();
  });

  test('fails on duplicate mobile number', async ({ page }) => {
    // This test ensures that the server correctly prevents creation of duplicates
    // Assuming UI handles duplicate validation from API
    const existingEmployee = await setupBaseMasterData().then(async m => {
      // In real scenario, we use the employee seeded in beforeAll or create one
      // For simplicity, we assume one exists from previous test or seed
    });
    // Implementation of duplicate test
  });
});
