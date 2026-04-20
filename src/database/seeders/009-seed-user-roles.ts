import { DataSource } from 'typeorm';

export async function seedUserRoles(db: DataSource) {
  await db.query(`
    INSERT INTO user_roles (id, user_id, role_id)
    SELECT NEWID(), u.id, r.id
    FROM users u
    JOIN roles r 
      ON (u.email = 'superadmin@mail.com' AND r.name = 'superadmin')
      OR (u.email = 'admin@mail.com' AND r.name = 'admin')
      OR (u.email = 'staff@mail.com' AND r.name = 'staff')
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = u.id AND ur.role_id = r.id
    )
  `);
}