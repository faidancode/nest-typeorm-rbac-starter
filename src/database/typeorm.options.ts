import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import type { DbConfig } from 'src/config/app.config';

dotenv.config();

function resolveDbConfig(dbConfig?: DbConfig) {
  if (dbConfig) {
    return dbConfig;
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  };
}

export function getTypeOrmOptions(dbConfig?: DbConfig): DataSourceOptions {
  const source = resolveDbConfig(dbConfig);

  return {
    type: 'mssql',
    host: source.host,
    port: source.port,
    database: source.database,
    username: source.user,
    password: source.password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };
}
