import { DataSource } from 'typeorm';
import { insertIfNotExists } from './base/upsert.helper';
import { randomUUID } from 'crypto';

export async function seedScopes(db: DataSource) {
  await insertIfNotExists(db, 'scopes', 'name', [
    { id: randomUUID(), name: 'own', priority: 1 },
    { id: randomUUID(), name: 'team', priority: 2 },
    { id: randomUUID(), name: 'department', priority: 3 },
    { id: randomUUID(), name: 'all', priority: 4 },
  ]);
}
