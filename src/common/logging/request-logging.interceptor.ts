import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from './app-logger.service';
import { RequestContextService } from '../context/request-context.service';

function extractUserId(user: unknown): string | undefined {
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  const candidate = user as Record<string, unknown>;
  const rawUserId = candidate.id ?? candidate.sub ?? candidate.userId;

  return typeof rawUserId === 'string' ? rawUserId : undefined;
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly requestContext: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: unknown }>();
    const res = http.getResponse<Response>();
    const startTime = Date.now();

    const userId = extractUserId(req.user);
    this.requestContext.setUserId(userId);

    return next.handle().pipe(
      tap(() => {
        this.logger.info({
          event: 'http_request',
          message: `${req.method} ${req.originalUrl}`,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startTime,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      }),
    );
  }
}
