 
import { describe, it, expect } from 'vitest';
import * as permissionGuard from '$lib/server/guards/permission.guard.js';

describe('Permission Guard', () => {
	const UNAUTHORIZED_MESSAGE = 'Unauthorized';

	describe('requireAuth', () => {
		it('should throw an error if user is null', () => {
			try {
				permissionGuard.requireAuth(null);
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.status).toBe(401);
				expect(e.body.message).toBe('Authentication required');
			}
		});

		it('should throw an error if user is undefined', () => {
			try {
				permissionGuard.requireAuth(undefined);
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.status).toBe(401);
				expect(e.body.message).toBe('Authentication required');
			}
		});

		it('should not throw if user is provided', () => {
			const mockUser = { id: '1', name: 'Test User' } as any;
			expect(() => permissionGuard.requireAuth(mockUser)).not.toThrow();
		});
	});

	describe('requireAdmin', () => {
		it('should throw an error if user is null', () => {
			try {
				permissionGuard.requireAdmin(null);
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.status).toBe(401);
			}
		});

		it('should throw an error if user is undefined', () => {
			try {
				permissionGuard.requireAdmin(undefined);
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.status).toBe(401);
			}
		});

		it('should not throw if user is provided and has permission', () => {
			const mockUser = { id: '1', name: 'Admin User', permissions: ['dashboard:admin'] } as any;
			expect(() => permissionGuard.requireAdmin(mockUser)).not.toThrow();
		});
	});

	describe('requirePermission', () => {
		it('should throw an error if user is null', () => {
			try {
				permissionGuard.requirePermission(null, 'some_permission');
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.status).toBe(401);
			}
		});

		it('should throw an error if user is undefined', () => {
			try {
				permissionGuard.requirePermission(undefined, 'some_permission');
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.status).toBe(401);
			}
		});

		it('should not throw if user is provided and has permission', () => {
			const mockUser = { id: '1', name: 'Test User', permissions: ['some_permission'] } as any;
			expect(() => permissionGuard.requirePermission(mockUser, 'some_permission')).not.toThrow();
		});
	});
});
