import { db } from '$lib/server/db.js';

export interface AuditLogCreateInput {
  entity_name: string;
  entity_cuid: string;
  action_type: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  field_name?: string | null;
  old_value?: any | null;
  new_value?: any | null;
  performed_by?: string | null;
  performed_by_type: 'USER' | 'SYSTEM' | 'CRON' | 'API';
  ip_address?: string | null;
  user_agent?: string | null;
  remarks?: string | null;
  request_id: string;
  correlation_id?: string | null;
}

export interface ListAuditLogsFilters {
  performed_by?: string;
  performed_by_type?: string;
  entity_name?: string;
  entity_cuid?: string;
  action_type?: string;
  status?: string;
  request_id?: string;
  correlation_id?: string;
  search?: string; // searches in remarks
  fromDate?: Date;
  toDate?: Date;
  skip?: number;
  take?: number;
}

export async function createAuditLogs(logs: AuditLogCreateInput[], tx?: any) {
  const client = tx || db;
  if (!client || !client.auditLog) {
    console.warn('[AuditDao] client.auditLog is undefined. Skipping audit log write.');
    return;
  }
  return client.auditLog.createMany({
    data: logs
  });
}

export async function listAuditLogs(filters: ListAuditLogsFilters, tx?: any) {
  const client = tx || db;
  const where: any = {};

  if (filters.performed_by) {
    where.performed_by = filters.performed_by;
  }
  if (filters.performed_by_type) {
    where.performed_by_type = filters.performed_by_type;
  }
  if (filters.entity_name) {
    where.entity_name = filters.entity_name;
  }
  if (filters.entity_cuid) {
    where.entity_cuid = filters.entity_cuid;
  }
  if (filters.action_type) {
    where.action_type = filters.action_type;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.request_id) {
    where.request_id = filters.request_id;
  }
  if (filters.correlation_id) {
    where.correlation_id = filters.correlation_id;
  }
  if (filters.search) {
    where.remarks = {
      contains: filters.search,
      mode: 'insensitive'
    };
  }
  if (filters.fromDate || filters.toDate) {
    where.created_at = {};
    if (filters.fromDate) {
      where.created_at.gte = filters.fromDate;
    }
    if (filters.toDate) {
      where.created_at.lte = filters.toDate;
    }
  }

  const [total, items] = await Promise.all([
    client.auditLog.count({ where }),
    client.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: filters.skip ?? 0,
      take: filters.take ?? 50
    })
  ]);

  return { total, items };
}
