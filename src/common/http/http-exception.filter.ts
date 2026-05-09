import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { fail } from './response';
import { RequestContextService } from '../context/request-context.service';

function getBusinessCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

function extractMessageAndDetails(exception: HttpException) {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return { message: response, details: undefined };
  }

  if (response && typeof response === 'object') {
    const payload = response as Record<string, unknown>;
    const message = payload.message;

    return {
      message:
        typeof message === 'string'
          ? message
          : Array.isArray(message)
            ? message.join(', ')
            : exception.message,
      details: payload.message ?? payload.error ?? undefined,
    };
  }

  return { message: exception.message, details: undefined };
}

@Catch()
@Injectable()
export class HttpExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly requestContext: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const requestId = this.requestContext.getRequestId();
    const context = this.requestContext.getSnapshot();

    if (exception instanceof ZodError) {
      this.logger.warn(
        `Validation error${requestId ? ` [${requestId}]` : ''}`,
      );

      response.status(HttpStatus.BAD_REQUEST).json(
        fail('VALIDATION_ERROR', 'Invalid request payload', {
          issues: exception.issues,
          requestId,
        }),
      );
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const { message, details } = extractMessageAndDetails(exception);

      if (status >= 500) {
        this.logger.error(
          `${exception.name}${requestId ? ` [${requestId}]` : ''}`,
          exception.stack,
          context ? JSON.stringify(context) : undefined,
        );
      }

      response
        .status(status)
        .json(
          fail(
            getBusinessCode(status),
            status >= 500 ? 'Internal server error' : message,
            details,
          ),
        );
      return;
    }

    const error =
      exception instanceof Error ? exception : new Error('Unknown error');

    this.logger.error(
      `${error.name}${requestId ? ` [${requestId}]` : ''}`,
      error.stack,
      context ? JSON.stringify(context) : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      fail('INTERNAL_SERVER_ERROR', 'Internal server error', {
        requestId,
      }),
    );
  }
}
