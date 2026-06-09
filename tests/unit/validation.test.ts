import { describe, it, expect } from 'vitest';
import * as roleValidator from '../../src/lib/server/validators/role.validator.js';
import * as shiftValidator from '../../src/lib/server/validators/shift.validator.js';
import * as locationValidator from '../../src/lib/server/validators/organization_location.validator.js';

describe('Validation Unit Tests', () => {
  describe('Role Validator', () => {
    it('should validate a correct create payload', () => {
      const valid = roleValidator.validateCreatePayload({ name: 'HR Manager' });
      expect(valid.name).toBe('HR Manager');
    });

    it('should reject a create payload with missing name', () => {
      expect(() => roleValidator.validateCreatePayload({})).toThrow('Name is required');
      expect(() => roleValidator.validateCreatePayload({ name: '   ' })).toThrow('Name is required');
    });

    it('should reject names with numbers or special characters', () => {
      expect(() => roleValidator.validateCreatePayload({ name: 'HR Manager 2' })).toThrow('Name must contain only letters and spaces');
      expect(() => roleValidator.validateCreatePayload({ name: 'HR_Manager' })).toThrow('Name must contain only letters and spaces');
    });

    it('should reject names exceeding 255 characters', () => {
      const longName = 'A'.repeat(256);
      expect(() => roleValidator.validateCreatePayload({ name: longName })).toThrow('Name exceeds maximum length of 255 characters');
    });

    it('should reject unknown keys in create payload', () => {
      expect(() => roleValidator.validateCreatePayload({ name: 'HR Manager', extra: 123 })).toThrow('Unknown field(s) in request payload');
    });

    it('should validate a correct update payload', () => {
      const valid = roleValidator.validateUpdatePayload({ name: 'Recruiter', status: false });
      expect(valid.name).toBe('Recruiter');
      expect(valid.status).toBe(false);
    });

    it('should reject update payload with invalid status type', () => {
      expect(() => roleValidator.validateUpdatePayload({ status: 'active' })).toThrow('Status must be a boolean');
    });
  });

  describe('Shift Validator', () => {
    it('should validate a correct create payload', () => {
      const payload = {
        shift_name: 'Night Shift',
        start_time: '1970-01-01T22:00:00Z',
        end_time: '1970-01-01T06:00:00Z',
        minimum_work_hours: 8
      };
      const valid = shiftValidator.validateCreatePayload(payload);
      expect(valid.shift_name).toBe('Night Shift');
      expect(valid.minimum_work_hours).toBe(8);
    });

    it('should reject shift name with numbers or special characters', () => {
      expect(() => shiftValidator.validateCreatePayload({ shift_name: 'Night Shift 9' })).toThrow('Shift name cannot contain numbers');
      expect(() => shiftValidator.validateCreatePayload({ shift_name: 'Night-Shift' })).toThrow('Shift name cannot contain special characters');
    });

    it('should reject unknown keys in shift create', () => {
      expect(() => shiftValidator.validateCreatePayload({ shift_name: 'Night', unknown_key: true })).toThrow('Unknown field(s) in request payload');
    });

    it('should validate a correct update payload', () => {
      const valid = shiftValidator.validateUpdatePayload({ minimum_work_hours: 7.5, status: false });
      expect(valid.minimum_work_hours).toBe(7.5);
      expect(valid.status).toBe(false);
    });
  });

  describe('Company Location Validator', () => {
    it('should validate a correct create payload', () => {
      const payload = {
        location_name: 'Bangalore Office',
        address_line1: '456 Tech Park',
        city: 'Bangalore',
        state_cuid: 'state-cuid',
        country_cuid: 'country-cuid',
        pin_code: '560001',
        timezone: 'Asia/Kolkata'
      };
      const valid = locationValidator.validateCreatePayload(payload);
      expect(valid.location_name).toBe('Bangalore Office');
      expect(valid.state_cuid).toBe('state-cuid');
      expect(valid.country_cuid).toBe('country-cuid');
    });

    it('should reject symbols-only or numbers-only location names', () => {
      expect(() => locationValidator.validateCreatePayload({ location_name: '12345' })).toThrow('Company Location name cannot contain only numbers');
      expect(() => locationValidator.validateCreatePayload({ location_name: '!!!' })).toThrow('Company Location name must contain at least one alphabet');
    });

    it('should reject location names with attached numbers', () => {
      expect(() => locationValidator.validateCreatePayload({ location_name: 'Location1' })).toThrow('Company Location name cannot contain numbers');
    });

    it('should reject unknown keys in location create', () => {
      expect(() => locationValidator.validateCreatePayload({ location_name: 'HQ', country_uuid: 'old-field' })).toThrow('Unknown field(s) in request payload');
    });

    it('should validate a correct update payload', () => {
      const valid = locationValidator.validateUpdatePayload({ is_active: false, state_cuid: 'new-state-cuid' });
      expect(valid.is_active).toBe(false);
      expect(valid.state_cuid).toBe('new-state-cuid');
    });

    it('should reject non-numeric pincode in create payload', () => {
      const payload = {
        location_name: 'Bangalore Office',
        address_line1: '456 Tech Park',
        city: 'Bangalore',
        state_cuid: 'state-cuid',
        country_cuid: 'country-cuid',
        pin_code: '560abc',
        timezone: 'Asia/Kolkata'
      };
      expect(() => locationValidator.validateCreatePayload(payload)).toThrow('Pin Code must contain numeric values only');
    });

    it('should reject non-numeric pincode in update payload', () => {
      expect(() => locationValidator.validateUpdatePayload({ pin_code: '123-456' })).toThrow('Pin Code must contain numeric values only');
    });
  });
});
