import { test, expect } from '@playwright/test';
import { generateRandomString } from '../utils/db-helper';

test.describe.skip('Department API Integration Tests', () => {
  let deptCuid2: string;

  test('POST /api/departments should create a new department', async ({ request }) => {
    const payload = {
      dept_name: `API Dept ${generateRandomString(4)}`,
      status: true
    };

    const response = await request.post('/api/departments', {
      data: payload
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.cuid2).toBeDefined();
    expect(body.data.dept_name).toBe(payload.dept_name);
    
    // Save cuid2 for later tests
    deptCuid2 = body.data.cuid2;
  });

  test('GET /api/departments should list departments', async ({ request }) => {
    const response = await request.get('/api/departments');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    
    // Ensure the previously created department is in the list
    const found = body.data.find((d: any) => d.cuid2 === deptCuid2);
    expect(found).toBeDefined();
  });

  test('PUT /api/departments should update an existing department using cuid2', async ({ request }) => {
    const payload = {
      dept_name: `Updated Dept ${generateRandomString(4)}`,
      status: false
    };

    const response = await request.put(`/api/departments?cuid2=${deptCuid2}`, {
      data: payload
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.dept_name).toBe(payload.dept_name);
    expect(body.data.status).toBe(false);
  });

  test('DELETE /api/departments should deactivate department using cuid2', async ({ request }) => {
    const response = await request.delete(`/api/departments?cuid2=${deptCuid2}`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    // Assuming delete simply sets status = false
    expect(body.data.status).toBe(false);
  });

  test('Validation failure on invalid payload', async ({ request }) => {
    const response = await request.post('/api/departments', {
      data: { dept_name: '' } // empty name should fail
    });

    expect(response.status()).toBe(400); // Bad Request expected
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
