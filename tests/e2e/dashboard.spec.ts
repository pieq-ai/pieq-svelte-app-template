import { expect, test } from '@playwright/test';

test('redirects unauthenticated users away from dashboard', async ({ page }) => {
	await page.goto('/dashboard');
	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: 'SvelteKit layered architecture' })).toBeVisible();
});
