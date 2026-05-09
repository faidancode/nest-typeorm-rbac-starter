import { Injectable } from '@nestjs/common';

interface CachedResponse {
  expiresAt: number;
  statusCode: number;
  payload: unknown;
}

@Injectable()
export class IdempotencyService {
  private readonly cache = new Map<string, CachedResponse>();
  private readonly ttlMs = 10 * 60 * 1000;

  get(key: string): CachedResponse | undefined {
    const cached = this.cache.get(key);
    if (!cached) {
      return undefined;
    }

    if (cached.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return cached;
  }

  set(key: string, statusCode: number, payload: unknown): void {
    this.cache.set(key, {
      expiresAt: Date.now() + this.ttlMs,
      statusCode,
      payload,
    });
  }
}
