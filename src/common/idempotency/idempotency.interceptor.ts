import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { of, tap } from 'rxjs';
import { createHash } from 'node:crypto';
import { IdempotencyService } from './idempotency.service';

function createCacheKey(req: Request) {
  const idempotencyKey = req.get('idempotency-key')?.trim();
  if (!idempotencyKey) {
    return undefined;
  }

  const bodyHash = createHash('sha256')
    .update(JSON.stringify(req.body ?? {}))
    .digest('hex');

  return `${req.method}:${req.originalUrl}:${idempotencyKey}:${bodyHash}`;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotency: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next.handle();
    }

    const cacheKey = createCacheKey(req);
    if (!cacheKey) {
      return next.handle();
    }

    const cached = this.idempotency.get(cacheKey);
    if (cached) {
      res.status(cached.statusCode);
      return of(cached.payload);
    }

    return next.handle().pipe(
      tap((payload) => {
        this.idempotency.set(cacheKey, res.statusCode || 200, payload);
      }),
    );
  }
}
