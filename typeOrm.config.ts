import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mssql',
  host: configService.getOrThrow('DB_HOST'),
  port: Number(configService.getOrThrow('DB_PORT')),
  database: configService.getOrThrow('DB_DATABASE'),
  username: configService.getOrThrow('DB_USERNAME'),
  password: configService.getOrThrow('DB_PASSWORD'),
  migrations: ['migrations/**'],
  entities: [],
  extra: {
    options: {
      encrypt: true, // Gunakan true jika Anda menggunakan Azure atau server dengan SSL
      trustServerCertificate: true, // Bypass error self-signed certificate
    },
  },
});
