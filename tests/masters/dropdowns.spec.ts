import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth-helper';

test.describe.skip('Master Dropdowns UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // Example test checking that dropdown endpoints map correctly
  // This verifies API responses but you can also navigate to pages and check the DOM
  test('department dropdown loads with cuid2 values', async ({ page }) => {
    const response = await page.request.get('/api/departments');
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    // Check that we get departments back, assuming test data is seeded
    if (body.data && body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('cuid2');
      expect(body.data[0]).toHaveProperty('dept_name');
    }
  });

  test('designation dropdown loads with cuid2 values', async ({ page }) => {
    const response = await page.request.get('/api/designations');
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    if (body.data && body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('cuid2');
      expect(body.data[0]).toHaveProperty('designation_name');
    }
  });
});
