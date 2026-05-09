import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './common/http/response.interceptor';
import { AppConfig } from './config/app.config';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { RequestContextService } from './common/context/request-context.service';
import { createRequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfig);
  const requestContext = app.get(RequestContextService);

  app.use(helmet());
  app.enableCors({
    origin: appConfig.cors.origins.includes('*') ? true : appConfig.cors.origins,
    credentials: appConfig.cors.credentials,
  });
  app.use(
    createRequestIdMiddleware(requestContext, appConfig.requestIdHeader),
  );
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.enableShutdownHooks();

  await app.listen(appConfig.port);
  console.log(
    `Application started on port ${appConfig.port} in ${appConfig.nodeEnv} mode`,
  );
}
bootstrap();
