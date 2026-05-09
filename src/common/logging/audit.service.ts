import { Injectable } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { RequestContextService } from '../context/request-context.service';

export interface AuditEvent {
  action: 'create' | 'update' | 'delete' | 'assign_permissions';
  resource: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly requestContext: RequestContextService,
  ) {}

  record(event: AuditEvent) {
    this.logger.info({
      event: 'audit_event',
      message: `${event.resource}.${event.action}`,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      before: event.before,
      after: event.after,
      metadata: event.metadata,
      actorId: this.requestContext.getUserId(),
      requestId: this.requestContext.getRequestId(),
      timestamp: new Date().toISOString(),
    });
  }
}
