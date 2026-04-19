import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './common/http/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
