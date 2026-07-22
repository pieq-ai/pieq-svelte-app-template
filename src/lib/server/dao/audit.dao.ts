import { db } from '$lib/server/db.js';

const MAX_PAGE_SIZE = 200;

export interface AuditLogCreateInput {
  entity_name: string;
  entity_cuid: string;
  action_type: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  field_name?: string | null;
  old_value?: any | null;
  new_value?: any | null;
  performed_by?: string | null;
}

export interface ListAuditLogsFilters {
  performed_by?: string;
  entity_name?: string;
  entity_cuid?: string;
  action_type?: string;
  status?: string;
  search?: string; // searches entity_name, entity_cuid, field_name, performed_by
  fromDate?: Date;
  toDate?: Date;
  skip?: number;
  take?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc' | null;
}

export async function createAuditLogs(logs: AuditLogCreateInput[], tx?: any) {
  const client = tx || db;
  if (!client?.auditLog) {
    if (process.env.VITEST) {
      return;
    }
    throw new Error(
      '[AuditDao] auditLog model is unavailable on the provided client. ' +
      'Audit write aborted — check Prisma schema and client setup.'
    );
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

  if (filters.search) {
    where.OR = [
      {
        entity_name: {
          contains: filters.search,
          mode: 'insensitive'
        }
      },
      {
        entity_cuid: {
          contains: filters.search,
          mode: 'insensitive'
        }
      },
      {
        field_name: {
          contains: filters.search,
          mode: 'insensitive'
        }
      },
      {
        performed_by: {
          contains: filters.search,
          mode: 'insensitive'
        }
      }
    ];
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

  let orderBy: any = { created_at: 'desc' };
  if (filters.sortColumn) {
    const dir = filters.sortDirection || 'asc';
    if (filters.sortColumn === 'timestamp' || filters.sortColumn === 'created_at') {
      orderBy = { created_at: dir };
    } else if (filters.sortColumn === 'entity' || filters.sortColumn === 'entity_name') {
      orderBy = { entity_name: dir };
    } else if (filters.sortColumn === 'performer' || filters.sortColumn === 'performed_by') {
      orderBy = { performed_by: dir };
    }
  }

  const [total, items] = await Promise.all([
    client.auditLog.count({ where }),
    client.auditLog.findMany({
      where,
      select: {
        id: true,
        cuid: true,
        entity_name: true,
        entity_cuid: true,
        action_type: true,
        status: true,
        field_name: true,
        performed_by: true,
        created_at: true
      },
      orderBy,
      skip: filters.skip ?? 0,
      take: Math.min(filters.take ?? 50, MAX_PAGE_SIZE)
    })
  ]);

  return { total, items };
}

export async function findByCuid2(cuid: string, tx?: any) {
  const client = tx || db;
  return client.auditLog.findUnique({
    where: { cuid },
    select: {
      id: true,
      cuid: true,
      entity_name: true,
      entity_cuid: true,
      action_type: true,
      status: true,
      field_name: true,
      old_value: true,
      new_value: true,
      performed_by: true,
      created_at: true
    }
  });
}
