import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { AppConfig } from 'src/config/app.config';
import { RequestContextService } from '../context/request-context.service';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitInterceptor', () => {
  const createContext = () => {
    const req = {
      originalUrl: '/v1/users',
      ip: '127.0.0.1',
      user: { id: 'user-1' },
    };
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getClass: () => ({ name: 'UserController' }),
      getHandler: () => ({ name: 'findAll' }),
    } as unknown as ExecutionContext;

    return { req, res, context };
  };

  const createInterceptor = (
    consumeMock: jest.Mock,
    reflectorGetMock: jest.Mock,
  ) => {
    const rateLimitService = {
      consume: consumeMock,
    } as unknown as RateLimitService;
    const appConfig = {
      rateLimit: {
        globalTtl: 60,
        globalLimit: 100,
        loginTtl: 60,
        loginLimit: 5,
      },
    } as AppConfig;
    const reflector = {
      get: reflectorGetMock,
    } as unknown as Reflector;
    const requestContext = {
      setUserId: jest.fn(),
      getUserId: jest.fn().mockReturnValue(undefined),
    } as unknown as RequestContextService;

    return {
      interceptor: new RateLimitInterceptor(
        rateLimitService,
        appConfig,
        reflector,
        requestContext,
      ),
      requestContext,
    };
  };

  it('applies controller-level rate limit with controller bucket key', async () => {
    const consumeMock = jest
      .fn()
      .mockReturnValueOnce({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60_000,
      })
      .mockReturnValueOnce({
        allowed: true,
        remaining: 9,
        resetAt: Date.now() + 1_000,
      });
    const reflectorGetMock = jest.fn((key, target) => {
      if (target?.name === 'UserController') {
        return {
          ttlMs: 1_000,
          limit: 10,
          scope: 'user',
        };
      }

      return undefined;
    });
    const { interceptor, requestContext } = createInterceptor(
      consumeMock,
      reflectorGetMock,
    );
    const { res, context } = createContext();
    const next = {
      handle: jest.fn().mockReturnValue(of('ok')),
    } as unknown as CallHandler;

    await expect(lastValueFrom(interceptor.intercept(context, next))).resolves.toBe(
      'ok',
    );

    expect(requestContext.setUserId).toHaveBeenCalledWith('user-1');
    expect(consumeMock).toHaveBeenNthCalledWith(1, 'global:127.0.0.1:ip', 100, 60_000);
    expect(consumeMock).toHaveBeenNthCalledWith(
      2,
      'UserController:user:user-1',
      10,
      1_000,
    );
    expect(res.setHeader).toHaveBeenCalledWith('x-controller-rate-limit-limit', 10);
    expect(res.setHeader).toHaveBeenCalledWith('x-controller-rate-limit-remaining', 9);
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it('applies endpoint-level rate limit with handler bucket key', async () => {
    const consumeMock = jest
      .fn()
      .mockReturnValueOnce({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60_000,
      })
      .mockReturnValueOnce({
        allowed: true,
        remaining: 4,
        resetAt: Date.now() + 1_000,
      });
    const reflectorGetMock = jest.fn((key, target) => {
      if (target?.name === 'findAll') {
        return {
          ttlMs: 1_000,
          limit: 5,
          scope: 'user',
        };
      }

      return undefined;
    });
    const { interceptor } = createInterceptor(consumeMock, reflectorGetMock);
    const { res, context } = createContext();
    const next = {
      handle: jest.fn().mockReturnValue(of('ok')),
    } as unknown as CallHandler;

    await expect(lastValueFrom(interceptor.intercept(context, next))).resolves.toBe(
      'ok',
    );

    expect(consumeMock).toHaveBeenNthCalledWith(2, 'UserController:findAll:user:user-1', 5, 1_000);
    expect(res.setHeader).toHaveBeenCalledWith('x-endpoint-rate-limit-limit', 5);
    expect(res.setHeader).toHaveBeenCalledWith('x-endpoint-rate-limit-remaining', 4);
  });

  it('returns 429 when endpoint rate limit is exceeded', async () => {
    const consumeMock = jest
      .fn()
      .mockReturnValueOnce({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60_000,
      })
      .mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 1_000,
      });
    const reflectorGetMock = jest.fn(() => ({
      ttlMs: 1_000,
      limit: 1,
      scope: 'user',
    }));
    const { interceptor } = createInterceptor(consumeMock, reflectorGetMock);
    const { res, context } = createContext();
    const next = {
      handle: jest.fn().mockReturnValue(of('ok')),
    } as unknown as CallHandler;

    await expect(lastValueFrom(interceptor.intercept(context, next))).resolves.toBeUndefined();

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'RATE_LIMITED',
        }),
      }),
    );
    expect(next.handle).not.toHaveBeenCalled();
  });
});
