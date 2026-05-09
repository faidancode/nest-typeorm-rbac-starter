import { Injectable } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import { RequestContextService } from '../context/request-context.service';

type LogLevel = 'info' | 'warn' | 'error';

export interface LogPayload {
  event: string;
  message?: string;
  [key: string]: unknown;
}

@Injectable()
export class AppLoggerService {
  private readonly logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json(),
    ),
    transports: [new transports.Console()],
  });

  constructor(private readonly requestContext: RequestContextService) {}

  private buildPayload(payload: LogPayload) {
    return {
      ...payload,
      requestId: this.requestContext.getRequestId(),
      userId: this.requestContext.getUserId(),
    };
  }

  log(level: LogLevel, payload: LogPayload) {
    this.logger.log(level, this.buildPayload(payload));
  }

  info(payload: LogPayload) {
    this.log('info', payload);
  }

  warn(payload: LogPayload) {
    this.log('warn', payload);
  }

  error(payload: LogPayload) {
    this.log('error', payload);
  }
}
