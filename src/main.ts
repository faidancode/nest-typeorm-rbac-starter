import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './common/http/response.interceptor';
import { AppConfig } from './config/app.config';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { RequestContextService } from './common/context/request-context.service';
import { createRequestIdMiddleware } from './common/middleware/request-id.middleware';
import { createRequestTimeoutMiddleware } from './common/middleware/request-timeout.middleware';
import { RequestLoggingInterceptor } from './common/logging/request-logging.interceptor';
import { AppLoggerService } from './common/logging/app-logger.service';
import { IdempotencyInterceptor } from './common/idempotency/idempotency.interceptor';
import { RateLimitInterceptor } from './common/rate-limit/rate-limit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfig);
  const requestContext = app.get(RequestContextService);
  const logger = app.get(AppLoggerService);

  app.use(helmet());
  app.enableCors({
    origin: appConfig.cors.origins.includes('*') ? true : appConfig.cors.origins,
    credentials: appConfig.cors.credentials,
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.use(
    createRequestIdMiddleware(requestContext, appConfig.requestIdHeader),
  );
  app.use(createRequestTimeoutMiddleware(appConfig.requestTimeoutMs));
  app.useGlobalInterceptors(
    app.get(RequestLoggingInterceptor),
    app.get(RateLimitInterceptor),
    app.get(IdempotencyInterceptor),
    new ResponseEnvelopeInterceptor(),
  );
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.enableShutdownHooks();

  await app.listen(appConfig.port);
  logger.info({
    event: 'app_started',
    message: 'Application started',
    port: appConfig.port,
    nodeEnv: appConfig.nodeEnv,
  });
}
bootstrap();
