import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from './typeorm.options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        ...getTypeOrmOptions(),
        autoLoadEntities: true, // ✅ penting
      }),
    }),
  ],
})
export class DatabaseModule {}
