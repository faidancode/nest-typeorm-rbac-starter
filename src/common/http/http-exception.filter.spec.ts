import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ZodError, z } from 'zod';
import { HttpExceptionFilter } from './http-exception.filter';
import { RequestContextService } from '../context/request-context.service';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let requestContext: {
    getRequestId: jest.Mock;
    getSnapshot: jest.Mock;
  };
  let logger: {
    warn: jest.Mock;
    error: jest.Mock;
  };

  const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  const createHost = (response: ReturnType<typeof createResponse>) =>
    ({
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    }) as any;

  beforeEach(() => {
    requestContext = {
      getRequestId: jest.fn().mockReturnValue('req-1'),
      getSnapshot: jest.fn().mockReturnValue({ requestId: 'req-1' }),
    };
    logger = {
      warn: jest.fn(),
      error: jest.fn(),
    };

    filter = new HttpExceptionFilter(
      requestContext as unknown as RequestContextService,
      logger as any,
    );
  });

  it('maps HttpException to a normalized error envelope', () => {
    const response = createResponse();
    const host = createHost(response);

    filter.catch(new NotFoundException('Department not found'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Department not found',
        }),
      }),
    );
  });

  it('maps ZodError to validation error envelope', () => {
    const response = createResponse();
    const host = createHost(response);

    let zodError: ZodError | undefined;
    try {
      z.object({
        name: z.string().min(3),
      }).parse({ name: 'ab' });
    } catch (error) {
      zodError = error as ZodError;
    }

    expect(zodError).toBeDefined();

    filter.catch(zodError, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      }),
    );
  });

  it('hides unexpected errors behind a generic envelope', () => {
    const response = createResponse();
    const host = createHost(response);

    filter.catch(new Error('boom'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        }),
      }),
    );
  });
});
