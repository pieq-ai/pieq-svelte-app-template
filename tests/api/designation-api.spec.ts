import { test, expect } from '@playwright/test';
import { generateRandomString } from '../utils/db-helper';

test.describe.skip('Designation API Integration Tests', () => {
  let desigCuid2: string;

  test('POST /api/designations should create a new designation', async ({ request }) => {
    const payload = {
      designation_name: `API Desig ${generateRandomString(4)}`,
      status: true
    };

    const response = await request.post('/api/designations', {
      data: payload
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.cuid2).toBeDefined();
    desigCuid2 = body.data.cuid2;
  });

  test('GET /api/designations should list designations', async ({ request }) => {
    const response = await request.get('/api/designations');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    const found = body.data.find((d: any) => d.cuid2 === desigCuid2);
    expect(found).toBeDefined();
  });

  test('PUT /api/designations should update an existing designation', async ({ request }) => {
    const payload = {
      designation_name: `Updated Desig ${generateRandomString(4)}`,
      status: true
    };

    const response = await request.put(`/api/designations?cuid2=${desigCuid2}`, {
      data: payload
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.designation_name).toBe(payload.designation_name);
  });
});
