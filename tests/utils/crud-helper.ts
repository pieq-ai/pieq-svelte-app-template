import { type Page, expect } from '@playwright/test';

export async function openCreateModal(page: Page, buttonText: string) {
  await page.getByRole('button', { name: buttonText }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

export async function fillInput(page: Page, label: string, value: string) {
  await page.getByLabel(label).fill(value);
}

export async function selectDropdownValue(page: Page, label: string, value: string) {
  // SvelteKit select elements often use standard select/option or custom combobox
  // For standard selects:
  const select = page.getByLabel(label);
  await select.selectOption({ label: value });
}

export async function selectDropdownByValueAttr(page: Page, label: string, valueAttr: string) {
  const select = page.getByLabel(label);
  await select.selectOption({ value: valueAttr });
}

export async function submitModalForm(page: Page, buttonText: string) {
  await page.getByRole('dialog').getByRole('button', { name: buttonText }).click();
}

export async function confirmDeleteModal(page: Page) {
  await page.getByRole('dialog', { name: /deactivate/i }).getByRole('button', { name: 'Deactivate' }).click();
  // Wait for dialog to disappear
  await expect(page.getByRole('dialog')).toBeHidden();
}

export async function expectToast(page: Page, messagePattern: RegExp | string) {
  // Assuming shadcn-svelte toasts use 'status' role or ol list
  const toast = page.locator('ol[data-sonner-toaster] li, [role="status"]').filter({ hasText: messagePattern });
  await expect(toast).toBeVisible();
}
