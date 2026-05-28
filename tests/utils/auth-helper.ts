import { type Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  // If your app requires actual login flow, implement here.
  // For HRMS testing, we assume an easy bypass or a mock login form at /auth/signin.
  await page.goto('/auth/signin');
  
  // Example dummy login for UI
  await page.fill('input[type="email"]', 'admin@pieq.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await expect(page).toHaveURL(/.*\/dashboard/);
}

export async function setAuthSessionCookie(page: Page) {
  // Alternatively, inject a session cookie to bypass UI login
  await page.context().addCookies([
    {
      name: 'session',
      value: 'dummy-test-session',
      domain: 'localhost',
      path: '/',
    }
  ]);
}
