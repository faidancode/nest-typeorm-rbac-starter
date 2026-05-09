import { createRateLimitMiddleware } from './rate-limit.middleware';
import { RateLimitService } from '../rate-limit/rate-limit.service';

describe('createRateLimitMiddleware', () => {
  it('bypasses health routes', () => {
    const rateLimitService = {
      consume: jest.fn(),
    } as unknown as RateLimitService;

    const middleware = createRateLimitMiddleware(rateLimitService, {
      globalTtl: 1,
      globalLimit: 1,
      loginTtl: 1,
      loginLimit: 1,
    });

    const next = jest.fn();
    middleware(
      { originalUrl: '/v1/health', ip: '127.0.0.1' } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalled();
    expect(rateLimitService.consume).not.toHaveBeenCalled();
  });

  it('returns 429 after the limit is exceeded', () => {
    const rateLimitService = {
      consume: jest
        .fn()
        .mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 1000 }),
    } as unknown as RateLimitService;

    const middleware = createRateLimitMiddleware(rateLimitService, {
      globalTtl: 1,
      globalLimit: 1,
      loginTtl: 1,
      loginLimit: 1,
    });

    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    middleware(
      { originalUrl: '/v1/users', ip: '127.0.0.1' } as any,
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'RATE_LIMITED',
        }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
