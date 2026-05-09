import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppConfig } from 'src/config/app.config';

@Controller()
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly appConfig: AppConfig,
  ) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'nest-typeorm-rbac-starter',
      nodeEnv: this.appConfig.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready() {
    try {
      await this.dataSource.query('SELECT 1 AS ready');

      return {
        status: 'ready',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('Database is not ready');
    }
  }
}
