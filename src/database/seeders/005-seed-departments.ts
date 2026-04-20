import { DataSource } from 'typeorm';
import { insertIfNotExists } from './base/upsert.helper';
import { randomUUID } from 'crypto';

export async function seedDepartments(db: DataSource) {
  await insertIfNotExists(db, 'departments', 'name', [
    { id: randomUUID(), name: 'Engineering' },
    { id: randomUUID(), name: 'HR' },
    { id: randomUUID(), name: 'Finance' },
    { id: randomUUID(), name: 'Production' },
  ]);
}
