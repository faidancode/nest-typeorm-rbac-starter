import { SetMetadata } from '@nestjs/common';

export type RateLimitScope = 'ip' | 'user';

export interface RateLimitOptions {
  ttlMs: number;
  limit: number;
  scope?: RateLimitScope;
  key?: string;
}

export const RATE_LIMIT_OPTIONS_KEY = 'rate_limit_options';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_OPTIONS_KEY, options);
