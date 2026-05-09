import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { HealthController } from '../src/health/health.controller';
import { DataSource } from 'typeorm';
import { AppConfig } from '../src/config/app.config';

describe('Health endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: jest.Mocked<Pick<DataSource, 'query'>>;

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: dataSource },
        {
          provide: AppConfig,
          useValue: {
            nodeEnv: 'test',
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            status: 'ok',
            service: 'nest-typeorm-rbac-starter',
            nodeEnv: 'test',
          }),
        );
      });
  });

  it('/v1/ready (GET)', async () => {
    dataSource.query.mockResolvedValue([{ ready: 1 }] as any);

    await request(app.getHttpServer())
      .get('/v1/ready')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            status: 'ready',
            database: 'up',
          }),
        );
      });
  });
});
