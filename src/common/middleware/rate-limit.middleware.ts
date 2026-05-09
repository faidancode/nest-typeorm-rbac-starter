import type { NextFunction, Request, Response } from 'express';
import { fail } from '../http/response';
import { RateLimitService } from '../rate-limit/rate-limit.service';

export interface RateLimitConfig {
  globalTtl: number;
  globalLimit: number;
  loginTtl: number;
  loginLimit: number;
}

function isSensitiveRoute(pathname: string) {
  return pathname.includes('/auth/login');
}

function isBypassedRoute(pathname: string) {
  return pathname.includes('/health') || pathname.includes('/ready');
}

export function createRateLimitMiddleware(
  rateLimitService: RateLimitService,
  config: RateLimitConfig,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const pathname = req.originalUrl.split('?')[0];

    if (isBypassedRoute(pathname)) {
      next();
      return;
    }

    const isSensitive = isSensitiveRoute(pathname);
    const ttlMs = (isSensitive ? config.loginTtl : config.globalTtl) * 1000;
    const limit = isSensitive ? config.loginLimit : config.globalLimit;
    const key = `${req.ip}:${isSensitive ? 'login' : 'global'}`;

    const result = rateLimitService.consume(key, limit, ttlMs);

    res.setHeader('x-rate-limit-limit', limit);
    res.setHeader('x-rate-limit-remaining', result.remaining);
    res.setHeader('x-rate-limit-reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      res.status(429).json(
        fail('RATE_LIMITED', 'Too many requests', {
          retryAfterMs: Math.max(result.resetAt - Date.now(), 0),
        }),
      );
      return;
    }

    next();
  };
}
