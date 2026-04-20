import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { insertIfNotExists } from './base/upsert.helper';
import { randomUUID } from 'crypto';

export async function seedUsers(db: DataSource) {
  const password = await bcrypt.hash('password', 10);

  await insertIfNotExists(db, 'users', 'email', [
    {
      id: randomUUID(),
      name: 'Super Admin',
      email: 'superadmin@mail.com',
      password_hash: password,
      is_active: 1,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    },
    {
      id: randomUUID(),
      name: 'Admin User',
      email: 'admin@mail.com',
      password_hash: password,
      is_active: 1,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    },
    {
      id: randomUUID(),
      name: 'Staff User',
      email: 'staff@mail.com',
      password_hash: password,
      is_active: 1,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    },
  ]);
}
