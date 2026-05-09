import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from 'src/config/app.config';
import { getTypeOrmOptions } from './typeorm.options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AppConfig],
      useFactory: async (appConfig: AppConfig) => ({
        ...getTypeOrmOptions(appConfig.db),
        autoLoadEntities: true, // ✅ penting
      }),
    }),
  ],
})
export class DatabaseModule {}
