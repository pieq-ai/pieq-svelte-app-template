import * as auditDao from '$lib/server/dao/audit.dao.js';
import { getRequestContext } from '$lib/server/utils/request-context.js';
import crypto from 'node:crypto';

const SENSITIVE_FIELDS = new Set([
  'password',
  'password_hash',
  'access_token',
  'refresh_token',
  'id_token',
  'session_state',
  'session_token',
  'secrets',
  'secret',
  'token',
  'keycloak_sub'
]);

const IGNORED_FIELDS = new Set([
  'id',
  'cuid',
  'created_at',
  'created_by',
  'updated_at',
  'updated_by',
  'deleted_at',
  'deleted_by',
  'is_deleted'
]);

function maskValue(fieldName: string, value: any): any {
  if (SENSITIVE_FIELDS.has(fieldName.toLowerCase())) {
    return '******';
  }
  if (value && typeof value === 'object') {
    if (typeof value.getMonth === 'function') {
      // It's a Date, don't try to loop keys
      return value;
    }
    if (
      (value.constructor && (value.constructor.name === 'Decimal' || value.constructor.name === 'd')) ||
      (value.s !== undefined && value.e !== undefined && Array.isArray(value.d))
    ) {
      return value.toString();
    }
    const masked: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        masked[key] = '******';
      } else {
        masked[key] = value[key];
      }
    }
    return masked;
  }
  return value;
}

function isEqual(val1: any, val2: any): boolean {
  if (val1 === val2) return true;
  
  if (typeof val1 === 'bigint' || typeof val2 === 'bigint') {
    return val1?.toString() === val2?.toString();
  }
  
  if (val1 instanceof Date && val2 instanceof Date) {
    return val1.getTime() === val2.getTime();
  }
  
  if (val1 instanceof Date || val2 instanceof Date) {
    const d1 = val1 instanceof Date ? val1 : new Date(val1);
    const d2 = val2 instanceof Date ? val2 : new Date(val2);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      return d1.getTime() === d2.getTime();
    }
  }
  
  if (val1 && typeof val1 === 'object' && val2 && typeof val2 === 'object') {
    if (typeof val1.equals === 'function') {
      return val1.equals(val2);
    }
    return JSON.stringify(val1) === JSON.stringify(val2);
  }
  
  if ((val1 === null || val1 === undefined || val1 === '') && (val2 === null || val2 === undefined || val2 === '')) {
    return true;
  }
  
  return false;
}

export interface LogParams {
  entity_name: string;
  entity_cuid: string;
  action_type: string;
  status?: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  field_name?: string | null;
  old_value?: any | null;
  new_value?: any | null;
  remarks?: string | null;
}

/**
 * Log a single audit event. Resolves request context automatically.
 */
export async function log(params: LogParams, tx?: any) {
  const context = getRequestContext();
  const performedBy = context?.performedBy || 'SYSTEM';
  const performedByType = context?.performedByType || 'SYSTEM';
  const ipAddress = context?.ipAddress || null;
  const userAgent = context?.userAgent || null;
  const requestId = context?.requestId || crypto.randomUUID();


  const old_value = params.old_value !== undefined ? maskValue(params.field_name || '', params.old_value) : null;
  const new_value = params.new_value !== undefined ? maskValue(params.field_name || '', params.new_value) : null;

  const logEntry: auditDao.AuditLogCreateInput = {
    entity_name: params.entity_name,
    entity_cuid: params.entity_cuid,
    action_type: params.action_type,
    status: params.status || 'SUCCESS',
    field_name: params.field_name || null,
    old_value: old_value ? { value: old_value } : null,
    new_value: new_value ? { value: new_value } : null,
    performed_by: performedBy,
    performed_by_type: performedByType,
    ip_address: ipAddress,
    user_agent: userAgent,
    request_id: requestId,
    remarks: params.remarks || null
  };

  return auditDao.createAuditLogs([logEntry], tx);
}

export interface LogUpdateParams {
  entityName: string;
  entityCuid: string;
  oldRecord: Record<string, any>;
  newRecord: Record<string, any>;
  remarks?: string | null;
}

/**
 * Diff old and new records, logging property-level changes in a single batch.
 */
export async function logUpdate(params: LogUpdateParams, tx?: any) {
  const context = getRequestContext();
  const performedBy = context?.performedBy || 'SYSTEM';
  const performedByType = context?.performedByType || 'SYSTEM';
  const ipAddress = context?.ipAddress || null;
  const userAgent = context?.userAgent || null;
  const requestId = context?.requestId || crypto.randomUUID();


  const allKeys = new Set([...Object.keys(params.oldRecord), ...Object.keys(params.newRecord)]);
  const logs: auditDao.AuditLogCreateInput[] = [];

  for (const key of allKeys) {
    if (IGNORED_FIELDS.has(key)) {
      continue;
    }

    const oldVal = params.oldRecord[key];
    const newVal = params.newRecord[key];

    if (!isEqual(oldVal, newVal)) {
      const maskedOld = maskValue(key, oldVal);
      const maskedNew = maskValue(key, newVal);

      logs.push({
        entity_name: params.entityName,
        entity_cuid: params.entityCuid,
        action_type: 'update',
        status: 'SUCCESS',
        field_name: key,
        old_value: maskedOld !== undefined ? { value: maskedOld } : null,
        new_value: maskedNew !== undefined ? { value: maskedNew } : null,
        performed_by: performedBy,
        performed_by_type: performedByType,
        ip_address: ipAddress,
        user_agent: userAgent,
        request_id: requestId,
        remarks: params.remarks || null
      });
    }
  }

  if (logs.length > 0) {
    return auditDao.createAuditLogs(logs, tx);
  }
}

/**
 * Query paginated, filtered list of audit logs.
 */
export async function getAuditLogs(filters: auditDao.ListAuditLogsFilters) {
  return auditDao.listAuditLogs(filters);
}

/**
 * Fetch a single audit log entry by CUID, including full old_value/new_value details.
 */
export async function getAuditLogByCuid(cuid: string) {
  return auditDao.findByCuid2(cuid);
}
