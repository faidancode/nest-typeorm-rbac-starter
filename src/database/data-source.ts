import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getTypeOrmOptions } from './typeorm.options';

export const AppDataSource = new DataSource(getTypeOrmOptions());
