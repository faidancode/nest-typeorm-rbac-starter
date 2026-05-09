import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';
import { AppConfig } from 'src/config/app.config';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: jest.Mocked<Pick<DataSource, 'query'>>;
  let appConfig: jest.Mocked<Pick<AppConfig, 'nodeEnv'>>;

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };
    appConfig = {
      nodeEnv: 'test',
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: dataSource },
        { provide: AppConfig, useValue: appConfig },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns a health payload', () => {
    const result = controller.health();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'nest-typeorm-rbac-starter',
        nodeEnv: 'test',
      }),
    );
  });

  it('returns ready when database query succeeds', async () => {
    dataSource.query.mockResolvedValue([{ ready: 1 }] as any);

    await expect(controller.ready()).resolves.toEqual(
      expect.objectContaining({
        status: 'ready',
        database: 'up',
      }),
    );
  });
});
