import { test, expect } from '@playwright/test';
import { generateRandomString, prisma } from '../utils/db-helper';
import { loginAsAdmin } from '../utils/auth-helper';

test.describe.skip('Role Permission Tests', () => {
  let roleCuid2: string;
  let permissionCuid2: string;

  test.beforeAll(async () => {
    // Setup isolated test data using Prisma directly
    const role = await prisma.systemRoles.create({
      data: { system_role_name: `Test Role ${generateRandomString(4)}` }
    });
    roleCuid2 = role.cuid2;

    const perm = await prisma.permissions.create({
      data: { permission_key: `test_perm_${generateRandomString(4)}` }
    });
    permissionCuid2 = perm.cuid2;
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('UI should map role and permission using cuid2', async ({ request }) => {
    // Assigning permission to role
    const response = await request.post('/api/role-permissions', {
      data: {
        system_role_cuid2: roleCuid2,
        permission_cuid2: permissionCuid2
      }
    });

    expect(response.status()).toBe(200);

    // Verify in db
    const mapping = await prisma.rolePermission.findFirst({
      where: {
        system_role_cuid2: roleCuid2,
        permission_cuid2: permissionCuid2
      }
    });

    expect(mapping).toBeDefined();
    expect(mapping?.system_role_cuid2).toBe(roleCuid2);
  });

  test('Cannot create duplicate role-permission mapping', async ({ request }) => {
    // Attempt duplicate assignment
    const response = await request.post('/api/role-permissions', {
      data: {
        system_role_cuid2: roleCuid2,
        permission_cuid2: permissionCuid2
      }
    });

    // Expect conflict or bad request due to unique constraint
    expect(response.status()).not.toBe(200);
  });
});
