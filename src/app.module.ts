import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.schema';
import { AppConfigModule } from './config/app-config.module';
import { RequestContextModule } from './common/context/request-context.module';
import { LoggingModule } from './common/logging/logging.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { TransactionModule } from './common/transactions/transaction.module';
import { IdempotencyModule } from './common/idempotency/idempotency.module';
import { DepartmentsModule } from './department/department.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PositionModule } from './position/position.module';
import { EmployeeModule } from './employee/employee.module';
import { HealthController } from './health/health.controller';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    AppConfigModule,
    RequestContextModule,
    LoggingModule,
    RateLimitModule,
    TransactionModule,
    IdempotencyModule,
    DatabaseModule,
    DepartmentsModule,
    RoleModule,
    AuthModule,
    UserModule,
    PositionModule,
    EmployeeModule,
    DashboardModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, HttpExceptionFilter],
})
export class AppModule {}
