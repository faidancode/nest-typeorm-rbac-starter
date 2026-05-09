import { Global, Module } from '@nestjs/common';
import { RequestContextModule } from '../context/request-context.module';
import { AppLoggerService } from './app-logger.service';
import { AuditService } from './audit.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Global()
@Module({
  imports: [RequestContextModule],
  providers: [AppLoggerService, AuditService, RequestLoggingInterceptor],
  exports: [AppLoggerService, AuditService, RequestLoggingInterceptor],
})
export class LoggingModule {}
