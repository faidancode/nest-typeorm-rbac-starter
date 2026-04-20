import { DataSource } from 'typeorm';
import { insertIfNotExists } from './base/upsert.helper';
import { randomUUID } from 'crypto';

export async function seedPermissions(db: DataSource) {
  const modules = ['employee', 'department', 'position', 'role', 'user'];
  const actions = ['create', 'read', 'update', 'delete'];

  const rows: {
    id: string;
    action: string;
    description: string;
  }[] = [];

  for (const module of modules) {
    for (const action of actions) {
      rows.push({
        id: randomUUID(),
        action: `${module}.${action}`,
        description: `${action} ${module}`,
      });
    }
  }

  await insertIfNotExists(db, 'permissions', 'action', rows);
}
