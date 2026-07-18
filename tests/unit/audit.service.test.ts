import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as auditService from '$lib/server/services/audit.service.js';
import * as auditDao from '$lib/server/dao/audit.dao.js';
import { runWithContext } from '$lib/server/utils/request-context.js';

vi.mock('$lib/server/dao/audit.dao.js', () => {
  return {
    createAuditLogs: vi.fn(),
    listAuditLogs: vi.fn(),
    findByCuid2: vi.fn()
  };
});

describe('Audit Logging Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log method', () => {
    it('should fall back to SYSTEM when no context is active', async () => {
      await auditService.log({
        entity_name: 'TestEntity',
        entity_cuid: 'cuid123',
        action_type: 'create',
        status: 'SUCCESS',
        remarks: 'Testing fallback'
      });

      expect(auditDao.createAuditLogs).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            performed_by: 'SYSTEM',
            performed_by_type: 'SYSTEM',
            remarks: 'Testing fallback'
          })
        ],
        undefined
      );
    });

    it('should resolve performer and IP details from Request Context', async () => {
      const mockContext = {
        performedBy: 'usr_abc123',
        performedByType: 'USER' as const,
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0',
        requestId: 'req_xyz789'
      };

      await runWithContext(mockContext, async () => {
        await auditService.log({
          entity_name: 'TestEntity',
          entity_cuid: 'cuid123',
          action_type: 'update',
          status: 'SUCCESS',
          remarks: 'Testing context'
        });
      });

      expect(auditDao.createAuditLogs).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            performed_by: 'usr_abc123',
            performed_by_type: 'USER',
            ip_address: '192.168.1.50',
            user_agent: 'Mozilla/5.0',
            request_id: 'req_xyz789',
            remarks: 'Testing context'
          })
        ],
        undefined
      );
    });

    it('should mask values if the logged field is sensitive', async () => {
      await auditService.log({
        entity_name: 'UserAccount',
        entity_cuid: 'cuid_usr',
        action_type: 'reset_password',
        status: 'SUCCESS',
        field_name: 'password',
        old_value: 'secret123',
        new_value: 'newsecret456'
      });

      expect(auditDao.createAuditLogs).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            old_value: { value: '******' },
            new_value: { value: '******' }
          })
        ],
        undefined
      );
    });

    it('should mask sensitive keys inside nested objects', async () => {
      await auditService.log({
        entity_name: 'UserAccount',
        entity_cuid: 'cuid_usr',
        action_type: 'oauth_connect',
        status: 'SUCCESS',
        field_name: 'auth_payload',
        old_value: { username: 'testuser', access_token: 'abc_token_123' },
        new_value: { username: 'testuser', access_token: 'xyz_token_456' }
      });

      expect(auditDao.createAuditLogs).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            old_value: { value: { username: 'testuser', access_token: '******' } },
            new_value: { value: { username: 'testuser', access_token: '******' } }
          })
        ],
        undefined
      );
    });
  });

  describe('logUpdate method', () => {
    it('should diff records and log only changed non-metadata fields', async () => {
      const oldRecord = {
        id: 1n,
        cuid: 'cuid1',
        first_name: 'John',
        last_name: 'Doe',
        pan_no: 'ABCDE1234F',
        created_at: new Date('2026-01-01')
      };

      const newRecord = {
        id: 1n,
        cuid: 'cuid1',
        first_name: 'Johnny', // Changed
        last_name: 'Doe', // Unchanged
        pan_no: 'ABCDE1234F', // Unchanged
        created_at: new Date('2026-01-02') // Metadata (ignored)
      };

      await auditService.logUpdate({
        entityName: 'Employee',
        entityCuid: 'cuid1',
        oldRecord,
        newRecord
      });

      expect(auditDao.createAuditLogs).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(auditDao.createAuditLogs).mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0]).toEqual(
        expect.objectContaining({
          entity_name: 'Employee',
          entity_cuid: 'cuid1',
          action_type: 'update',
          field_name: 'first_name',
          old_value: { value: 'John' },
          new_value: { value: 'Johnny' }
        })
      );
    });

    it('should treat equivalent Date types as unchanged', async () => {
      const oldRecord = {
        date_of_joining: new Date('2026-06-01T00:00:00.000Z')
      };
      const newRecord = {
        date_of_joining: new Date('2026-06-01T00:00:00.000Z')
      };

      await auditService.logUpdate({
        entityName: 'Employee',
        entityCuid: 'cuid1',
        oldRecord,
        newRecord
      });

      expect(auditDao.createAuditLogs).not.toHaveBeenCalled();
    });

    it('should handle decimal and numeric objects via custom comparison', async () => {
      const oldRecord = {
        amount: { equals: (other: any) => other && other.val === 500, val: 500 }
      };
      const newRecord = {
        amount: { equals: (other: any) => other && other.val === 500, val: 500 }
      };

      await auditService.logUpdate({
        entityName: 'SalaryStructure',
        entityCuid: 'cuid1',
        oldRecord,
        newRecord
      });

      expect(auditDao.createAuditLogs).not.toHaveBeenCalled();
    });

    it('should treat null, undefined, and empty string as equivalent', async () => {
      const oldRecord = {
        remarks: null,
        middle_name: '',
        title: undefined
      };
      const newRecord = {
        remarks: '',
        middle_name: undefined,
        title: null
      };

      await auditService.logUpdate({
        entityName: 'Employee',
        entityCuid: 'cuid1',
        oldRecord,
        newRecord
      });

      expect(auditDao.createAuditLogs).not.toHaveBeenCalled();
    });

    it('should mask sensitive field changes during update diffing', async () => {
      const oldRecord = {
        password_hash: 'old_hash_123'
      };
      const newRecord = {
        password_hash: 'new_hash_456'
      };

      await auditService.logUpdate({
        entityName: 'UserAccount',
        entityCuid: 'cuid1',
        oldRecord,
        newRecord
      });

      expect(auditDao.createAuditLogs).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            field_name: 'password_hash',
            old_value: { value: '******' },
            new_value: { value: '******' }
          })
        ],
        undefined
      );
    });
  });

  describe('getAuditLogs method', () => {
    it('should delegate to auditDao.listAuditLogs', async () => {
      const mockFilters = { search: 'test' };
      vi.mocked(auditDao.listAuditLogs).mockResolvedValue({ total: 10, items: [] });
      const result = await auditService.getAuditLogs(mockFilters);
      expect(auditDao.listAuditLogs).toHaveBeenCalledWith(mockFilters);
      expect(result).toEqual({ total: 10, items: [] });
    });
  });

  describe('getAuditLogByCuid method', () => {
    it('should delegate to auditDao.findByCuid2', async () => {
      const mockLog = { cuid: 'cuid123', remarks: 'test log' };
      vi.mocked(auditDao.findByCuid2).mockResolvedValue(mockLog as any);
      const result = await auditService.getAuditLogByCuid('cuid123');
      expect(auditDao.findByCuid2).toHaveBeenCalledWith('cuid123');
      expect(result).toEqual(mockLog);
    });
  });
});
