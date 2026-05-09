import { createRequestTimeoutMiddleware } from './request-timeout.middleware';

describe('createRequestTimeoutMiddleware', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns timeout response when request takes too long', () => {
    const middleware = createRequestTimeoutMiddleware(1000);
    const response = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      on: jest.fn(),
    } as any;
    const request = {} as any;
    const next = jest.fn();

    middleware(request, response, next);
    jest.advanceTimersByTime(1000);

    expect(next).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'REQUEST_TIMEOUT',
        }),
      }),
    );
  });
});
