import { Injectable } from '@nestjs/common';

interface WindowState {
  count: number;
  expiresAt: number;
}

@Injectable()
export class RateLimitService {
  private readonly windows = new Map<string, WindowState>();

  consume(key: string, limit: number, ttlMs: number) {
    const now = Date.now();
    const current = this.windows.get(key);

    if (!current || current.expiresAt <= now) {
      const nextWindow: WindowState = {
        count: 1,
        expiresAt: now + ttlMs,
      };

      this.windows.set(key, nextWindow);

      return {
        allowed: true,
        remaining: Math.max(limit - 1, 0),
        resetAt: nextWindow.expiresAt,
      };
    }

    current.count += 1;

    if (current.count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: current.expiresAt,
      };
    }

    this.windows.set(key, current);

    return {
      allowed: true,
      remaining: Math.max(limit - current.count, 0),
      resetAt: current.expiresAt,
    };
  }
}
