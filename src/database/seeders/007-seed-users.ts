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

  const staffRole = await db.query(`
    SELECT TOP 1 id
    FROM roles
    WHERE name = 'staff'
  `);

  if (!staffRole.length) {
    throw new Error('Role "staff" not found');
  }

  await db.query(
    `
    INSERT INTO user_roles (id, user_id, role_id)
    SELECT NEWID(), u.id, @0
    FROM users u
    WHERE u.email IN ('superadmin@mail.com', 'admin@mail.com', 'staff@mail.com')
      AND NOT EXISTS (
        SELECT 1
        FROM user_roles ur
        WHERE ur.user_id = u.id
          AND ur.role_id = @0
      )
  `,
    [staffRole[0].id],
  );
}
