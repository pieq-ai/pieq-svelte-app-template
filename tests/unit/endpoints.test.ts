import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../../src/lib/server/db.js';

// Import Role Endpoints
import * as rolesApi from '../../src/routes/api/roles/+server.js';
import * as rolesCuidApi from '../../src/routes/api/roles/[cuid]/+server.js';

// Import Shift Endpoints
import * as shiftsApi from '../../src/routes/api/shifts/+server.js';
import * as shiftsCuidApi from '../../src/routes/api/shifts/[cuid]/+server.js';

// Import Location Endpoints
import * as locationsApi from '../../src/routes/api/organization_location/+server.ts';
import * as locationsCuidApi from '../../src/routes/api/organization_location/[cuid]/+server.ts';

describe('API Endpoint Integration Tests', () => {
  beforeAll(async () => {
    // Database cleanup to keep tests idempotent
    await db.role.deleteMany({ where: { name: { in: ['API Role', 'API Role Updated', 'API Conflict Role'] } } });
    await db.shift.deleteMany({ where: { shift_name: { in: ['API Shift', 'API Shift Updated', 'API Conflict Shift'] } } });
    await db.companyLocation.deleteMany({ where: { name: { in: ['API Location', 'API Location Updated', 'API Conflict Location'] } } });
  });

  describe('Roles API Endpoints', () => {
    it('should test full HTTP lifecycles and error scenarios for Roles', async () => {
      // 1. POST: 415 Unsupported Media Type
      const badHeadersRequest = new Request('http://localhost/api/roles', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: JSON.stringify({ name: 'API Role' })
      });
      const res415 = await rolesApi.POST({ request: badHeadersRequest } as any);
      expect(res415.status).toBe(415);

      // 2. POST: 400 Bad Request - Validation Failures (Invalid Name)
      const badNameRequest = new Request('http://localhost/api/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'API Role 123' })
      });
      const res400BadName = await rolesApi.POST({ request: badNameRequest } as any);
      expect(res400BadName.status).toBe(400);

      // 3. POST: 400 Bad Request - Unknown/extra payload keys
      const badKeysRequest = new Request('http://localhost/api/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'API Role', unknown_key: true })
      });
      const res400BadKeys = await rolesApi.POST({ request: badKeysRequest } as any);
      expect(res400BadKeys.status).toBe(400);

      // 4. POST: 201 Created - Valid Payload
      const validPostRequest = new Request('http://localhost/api/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'API Role' })
      });
      const res201 = await rolesApi.POST({ request: validPostRequest } as any);
      expect(res201.status).toBe(201);
      const postJson = await res201.json();
      const cuid = postJson.data.cuid;
      expect(cuid).toBeDefined();

      // 5. POST: 409 Conflict - Duplicate check
      const duplicateRequest = new Request('http://localhost/api/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'API Role' })
      });
      const res409 = await rolesApi.POST({ request: duplicateRequest } as any);
      expect(res409.status).toBe(409);

      // 6. GET: 200 OK
      const getUrl = new URL('http://localhost/api/roles?includeInactive=true');
      const getRes = await rolesApi.GET({ url: getUrl } as any);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.data.some((r: any) => r.cuid === cuid)).toBe(true);

      // 7. PUT: 400 Bad Request - Invalid CUID format
      const invalidCuidPut = new Request(`http://localhost/api/roles/short`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'API Role Updated' })
      });
      const putRes400 = await rolesCuidApi.PUT({ request: invalidCuidPut, params: { cuid: 'short' } } as any);
      expect(putRes400.status).toBe(400);

      // 8. PUT: 404 Not Found - Correct CUID format but non-existent
      const nonExistentCuid = 'c123456789012345678901234';
      const notFoundPut = new Request(`http://localhost/api/roles/${nonExistentCuid}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'API Role Updated' })
      });
      const putRes404 = await rolesCuidApi.PUT({ request: notFoundPut, params: { cuid: nonExistentCuid } } as any);
      expect(putRes404.status).toBe(404);

      // 9. PUT: 200 OK - Successful partial update
      const validPutRequest = new Request(`http://localhost/api/roles/${cuid}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'API Role Updated' })
      });
      const putRes200 = await rolesCuidApi.PUT({ request: validPutRequest, params: { cuid: cuid } } as any);
      expect(putRes200.status).toBe(200);

      // 10. DELETE: 200 OK - Soft-delete
      const deleteRes = await rolesCuidApi.DELETE({ params: { cuid: cuid } } as any);
      expect(deleteRes.status).toBe(200);

      // Cleanup
      await db.role.delete({ where: { cuid } });
    });
  });

  describe('Shifts API Endpoints', () => {
    it('should test full HTTP lifecycles and error scenarios for Shifts', async () => {
      // 1. POST: 400 Bad Request - Malformed JSON
      const malformedRequest = new Request('http://localhost/api/shifts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ malformed json: true '
      });
      const malformedRes = await shiftsApi.POST({ request: malformedRequest } as any);
      expect(malformedRes.status).toBe(400);

      // 2. POST: 201 Created
      const validPostRequest = new Request('http://localhost/api/shifts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shift_name: 'API Shift',
          start_time: '1970-01-01T10:00:00Z',
          end_time: '1970-01-01T18:00:00Z',
          minimum_work_hours: 8
        })
      });
      const res201 = await shiftsApi.POST({ request: validPostRequest } as any);
      expect(res201.status).toBe(201);
      const postJson = await res201.json();
      const cuid = postJson.data.cuid;
      expect(cuid).toBeDefined();

      // 3. GET: 200 OK
      const getRes = await shiftsApi.GET({ url: new URL('http://localhost/api/shifts') } as any);
      expect(getRes.status).toBe(200);

      // 4. PUT: 200 OK
      const validPutRequest = new Request(`http://localhost/api/shifts/${cuid}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ minimum_work_hours: 7.5 })
      });
      const putRes = await shiftsCuidApi.PUT({ request: validPutRequest, params: { cuid: cuid } } as any);
      expect(putRes.status).toBe(200);

      // 5. DELETE: 200 OK - Soft-delete
      const deleteRes = await shiftsCuidApi.DELETE({ params: { cuid: cuid } } as any);
      expect(deleteRes.status).toBe(200);

      // 6. PATCH: 200 OK - Activation
      const patchRes = await shiftsCuidApi.PATCH({ params: { cuid: cuid } } as any);
      expect(patchRes.status).toBe(200);

      // Cleanup
      await db.shift.delete({ where: { cuid } });
    });
  });

  describe('Locations API Endpoints', () => {
    it('should test full HTTP lifecycles and error scenarios for Company Locations', async () => {
      // 1. POST: 201 Created
      const validPostRequest = new Request('http://localhost/api/organization_location', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'API Location',
          address_line1: '123 API Way',
          city: 'API Town',
          state_cuid: 'state-cuid',
          country_cuid: 'country-cuid',
          pin_code: '000000',
          timezone: 'UTC'
        })
      });
      const res201 = await locationsApi.POST({ request: validPostRequest } as any);
      expect(res201.status).toBe(201);
      const postJson = await res201.json();
      const cuid = postJson.data.cuid;
      expect(cuid).toBeDefined();

      // 2. GET: 200 OK
      const getRes = await locationsApi.GET({ url: new URL('http://localhost/api/organization_location') } as any);
      expect(getRes.status).toBe(200);

      // 3. PUT: 200 OK
      const validPutRequest = new Request(`http://localhost/api/organization_location/${cuid}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ city: 'New API Town' })
      });
      const putRes = await locationsCuidApi.PUT({ request: validPutRequest, params: { cuid: cuid } } as any);
      expect(putRes.status).toBe(200);

      // 4. DELETE: 200 OK - Soft-delete
      const deleteRes = await locationsCuidApi.DELETE({ params: { cuid: cuid } } as any);
      expect(deleteRes.status).toBe(200);

      // 5. PATCH: 200 OK - Activation
      const patchRes = await locationsCuidApi.PATCH({ params: { cuid: cuid } } as any);
      expect(patchRes.status).toBe(200);

      // Cleanup
      await db.companyLocation.delete({ where: { cuid } });
    });
  });
});
