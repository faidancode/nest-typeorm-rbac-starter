import { DataSource } from 'typeorm';
import { insertIfNotExists } from './base/upsert.helper';
import { randomUUID } from 'crypto';

export async function seedRoles(db: DataSource) {
  await insertIfNotExists(db, 'roles', 'name', [
    {
      id: randomUUID(),
      name: 'superadmin',
      description: 'Full access',
    },
    {
      id: randomUUID(),
      name: 'admin',
      description: 'Department access',
    },
    {
      id: randomUUID(),
      name: 'staff',
      description: 'Own access',
    },
  ]);
}
