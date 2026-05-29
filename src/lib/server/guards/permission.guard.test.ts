import { describe, it, expect } from 'vitest';
import * as permissionGuard from './permission.guard.js';

describe('Permission Guard', () => {
	const UNAUTHORIZED_MESSAGE = 'Unauthorized';

	describe('requireAuth', () => {
		it('should throw an error if user is null', () => {
			expect(() => permissionGuard.requireAuth(null)).toThrow(UNAUTHORIZED_MESSAGE);
		});

		it('should throw an error if user is undefined', () => {
			expect(() => permissionGuard.requireAuth(undefined)).toThrow(UNAUTHORIZED_MESSAGE);
		});

		it('should not throw if user is provided', () => {
			const mockUser = { id: '1', name: 'Test User' } as any;
			expect(() => permissionGuard.requireAuth(mockUser)).not.toThrow();
		});
	});

	describe('requireAdmin', () => {
		it('should throw an error if user is null', () => {
			expect(() => permissionGuard.requireAdmin(null)).toThrow(UNAUTHORIZED_MESSAGE);
		});

		it('should throw an error if user is undefined', () => {
			expect(() => permissionGuard.requireAdmin(undefined)).toThrow(UNAUTHORIZED_MESSAGE);
		});

		it('should not throw if user is provided', () => {
			const mockUser = { id: '1', name: 'Admin User' } as any;
			expect(() => permissionGuard.requireAdmin(mockUser)).not.toThrow();
		});
	});

	describe('requirePermission', () => {
		it('should throw an error if user is null', () => {
			expect(() => permissionGuard.requirePermission(null, 'some_permission')).toThrow(UNAUTHORIZED_MESSAGE);
		});

		it('should throw an error if user is undefined', () => {
			expect(() => permissionGuard.requirePermission(undefined, 'some_permission')).toThrow(UNAUTHORIZED_MESSAGE);
		});

		it('should not throw if user is provided', () => {
			const mockUser = { id: '1', name: 'Test User' } as any;
			expect(() => permissionGuard.requirePermission(mockUser, 'some_permission')).not.toThrow();
		});
	});
});
