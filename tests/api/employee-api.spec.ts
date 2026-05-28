import { test, expect } from '@playwright/test';
import { setupBaseMasterData } from '../fixtures/test-data';
import { generateRandomString } from '../utils/db-helper';

test.describe.skip('Employee API Integration Tests', () => {
  let masterData: any;
  let employeeCuid2: string;

  test.beforeAll(async () => {
    masterData = await setupBaseMasterData();
  });

  test('POST /api/employees should create a new employee using cuid2 references', async ({ request }) => {
    const payload = {
      emp_code: `EMP-API-${generateRandomString(4)}`,
      first_name: 'API',
      last_name: 'TestUser',
      dob: '1995-05-15',
      gender: 'Male',
      blood_group_cuid2: masterData.bloodGroup.cuid2,
      marital_status: 'single',
      nationality_cuid2: masterData.nationality.cuid2,
      mobile_no: `9900${generateRandomString(6).replace(/[^0-9]/g, '0').padEnd(6, '0')}`,
      personal_email: `api.${generateRandomString(5)}@example.com`,
      aadhar_no: `9999${generateRandomString(8).replace(/[^0-9]/g, '0').padEnd(8, '0')}`,
      pan_no: `ABCDE${generateRandomString(4).replace(/[^0-9]/g, '0').padEnd(4, '0')}F`,
    };

    const response = await request.post('/api/employees', {
      data: payload
    });

    // Check successful creation
    expect(response.status()).toBe(200);
    const body = await response.json();
    
    // Assert cuid2 properties
    expect(body.data.cuid2).toBeDefined();
    expect(body.data.blood_group_cuid2).toBe(payload.blood_group_cuid2);
    expect(body.data.nationality_cuid2).toBe(payload.nationality_cuid2);
    
    employeeCuid2 = body.data.cuid2;
  });

  test('GET /api/employees should fetch employees with joins', async ({ request }) => {
    const response = await request.get('/api/employees');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    const found = body.data.find((e: any) => e.cuid2 === employeeCuid2);
    expect(found).toBeDefined();
  });
});
