import { of, lastValueFrom } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyInterceptor', () => {
  it('returns cached payload for duplicate mutating requests', async () => {
    const service = new IdempotencyService();
    const interceptor = new IdempotencyInterceptor(service);

    const response = {
      status: jest.fn().mockReturnThis(),
    };

    const request = {
      method: 'POST',
      originalUrl: '/v1/users',
      body: { email: 'test@example.com' },
      get: (header: string) =>
        header.toLowerCase() === 'idempotency-key' ? 'abc-123' : undefined,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as any;

    const next = {
      handle: () => of({ ok: true }),
    };

    const first = await lastValueFrom(interceptor.intercept(context, next));
    expect(first).toEqual({ ok: true });

    const second = await lastValueFrom(interceptor.intercept(context, next));
    expect(second).toEqual({ ok: true });
    expect(response.status).toHaveBeenCalled();
  });
});
