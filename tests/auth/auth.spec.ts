import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth-helper';

test.describe.skip('Authentication Flows', () => {
  test('redirects to signin when accessing protected route without session', async ({ page }) => {
    // Attempt to access a protected route
    await page.goto('/dashboard');
    
    // Expect redirect to auth page (if logic is implemented in hooks.server.ts)
    // Note: Adjust the expected URL based on actual redirect behavior in HRMS
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('successfully logs in and accesses dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('can log out successfully', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Click logout from sidebar
    await page.getByRole('button', { name: 'Sign out' }).click();
    
    // Verify redirection to sign in or home
    await expect(page).toHaveURL(/.*\/auth\/signin|\/$/);
  });
});
