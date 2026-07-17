import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  performedBy?: string; // keycloak sub, email, or system identifier
  performedByType: 'USER' | 'SYSTEM' | 'CRON' | 'API';
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  correlationId?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function getCurrentUser(): string | undefined {
  return requestContextStorage.getStore()?.performedBy;
}

export function getRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId;
}

export function getClientIPAddress(): string | undefined {
  return requestContextStorage.getStore()?.ipAddress;
}

export function getUserAgent(): string | undefined {
  return requestContextStorage.getStore()?.userAgent;
}

export function getCorrelationId(): string | undefined {
  return requestContextStorage.getStore()?.correlationId;
}

export function runWithContext<T>(context: RequestContext, callback: () => T): T {
  return requestContextStorage.run(context, callback);
}
