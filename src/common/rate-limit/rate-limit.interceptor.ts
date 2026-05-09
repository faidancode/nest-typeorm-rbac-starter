import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import { AppConfig } from 'src/config/app.config';
import { RequestContextService } from '../context/request-context.service';
import { fail } from '../http/response';
import { RateLimitService } from './rate-limit.service';
import {
  RATE_LIMIT_OPTIONS_KEY,
  type RateLimitOptions,
  type RateLimitScope,
} from './rate-limit.decorator';

function extractUserId(user: unknown): string | undefined {
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  const candidate = user as Record<string, unknown>;
  const rawUserId = candidate.id ?? candidate.sub ?? candidate.userId;

  return typeof rawUserId === 'string' ? rawUserId : undefined;
}

function isBypassedRoute(pathname: string) {
  return pathname.includes('/health') || pathname.includes('/ready');
}

type RateLimitBucket = 'global' | 'controller' | 'endpoint';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly appConfig: AppConfig,
    private readonly reflector: Reflector,
    private readonly requestContext: RequestContextService,
  ) {}

  private buildKey(
    scope: RateLimitScope,
    req: Request & { user?: unknown },
    context: ExecutionContext,
    bucket: RateLimitBucket,
    key?: string,
  ) {
    if (key) {
      return key;
    }

    const userId = extractUserId(req.user) ?? this.requestContext.getUserId();
    if (scope === 'user' && userId) {
      const base =
        bucket === 'controller'
          ? context.getClass().name
          : `${context.getClass().name}:${context.getHandler().name}`;

      return `${base}:user:${userId}`;
    }

    return `${bucket}:${req.ip}:ip`;
  }

  private consumeBucket(
    req: Request & { user?: unknown },
    context: ExecutionContext,
    options: RateLimitOptions,
    bucket: RateLimitBucket,
  ) {
    const scope = options.scope ?? 'ip';
    const ttlMs = options.ttlMs;
    const limit = options.limit;
    const key = this.buildKey(scope, req, context, bucket, options.key);
    const result = this.rateLimitService.consume(key, limit, ttlMs);

    return {
      key,
      scope,
      limit,
      ttlMs,
      result,
      bucket,
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: unknown }>();
    const res = http.getResponse<Response>();
    const pathname = req.originalUrl.split('?')[0];

    if (isBypassedRoute(pathname)) {
      return next.handle();
    }

    const userId = extractUserId(req.user);
    this.requestContext.setUserId(userId);

    const globalCheck = this.consumeBucket(
      req,
      context,
      {
        ttlMs: this.appConfig.rateLimit.globalTtl * 1000,
        limit: this.appConfig.rateLimit.globalLimit,
        scope: 'ip',
      },
      'global',
    );

    const handlerOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_OPTIONS_KEY,
      context.getHandler(),
    );
    const classOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_OPTIONS_KEY,
      context.getClass(),
    );
    const endpointOptions = handlerOptions ?? classOptions;
    const endpointBucket: RateLimitBucket | undefined = handlerOptions
      ? 'endpoint'
      : classOptions
        ? 'controller'
        : undefined;

    const endpointCheck = endpointOptions
      ? this.consumeBucket(req, context, endpointOptions, endpointBucket!)
      : undefined;

    const checks = [globalCheck, endpointCheck].filter(Boolean) as Array<
      NonNullable<typeof globalCheck>
    >;

    for (const check of checks) {
      const headerPrefix =
        check.bucket === 'global'
          ? 'x-rate-limit'
          : check.bucket === 'controller'
            ? 'x-controller-rate-limit'
            : 'x-endpoint-rate-limit';
      res.setHeader(`${headerPrefix}-limit`, check.limit);
      res.setHeader(`${headerPrefix}-remaining`, check.result.remaining);
      res.setHeader(`${headerPrefix}-reset`, Math.ceil(check.result.resetAt / 1000));

      if (!check.result.allowed) {
        res.status(429).json(
          fail('RATE_LIMITED', 'Too many requests', {
            scope: check.scope,
            limit: check.limit,
            retryAfterMs: Math.max(check.result.resetAt - Date.now(), 0),
          }),
        );
        return of(undefined);
      }
    }

    return next.handle();
  }
}
