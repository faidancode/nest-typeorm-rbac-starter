import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    service = new RateLimitService();
  });

  it('allows requests within the limit', () => {
    const result = service.consume('ip-1', 2, 10_000);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('blocks requests after the limit is exceeded', () => {
    service.consume('ip-1', 1, 10_000);
    const result = service.consume('ip-1', 1, 10_000);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
