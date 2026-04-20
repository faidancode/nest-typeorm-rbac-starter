import 'reflect-metadata';
import { AppDataSource } from 'src/database/data-source';
import { runSeed } from 'src/database/seed';

async function bootstrap() {
  await AppDataSource.initialize();
  await runSeed(AppDataSource);
  await AppDataSource.destroy();
}

bootstrap();
