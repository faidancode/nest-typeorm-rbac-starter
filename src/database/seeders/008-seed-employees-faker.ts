import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export async function seedEmployeesFaker(db: DataSource) {
  const password = await bcrypt.hash('password123', 10);

  const departments = await db.query(`SELECT id FROM departments`);
  const positions = await db.query(`SELECT id, department_id FROM positions`);
  const staffRoleRes = await db.query(
    `SELECT id FROM roles WHERE name = 'staff'`,
  );

  if (
    departments.length === 0 ||
    positions.length === 0 ||
    staffRoleRes.length === 0
  ) {
    console.error('❌ Gagal: Seed department, position, dan role dolo!');
    return;
  }

  const staffRoleId = staffRoleRes[0].id;

  for (let i = 0; i < 100; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const exists = await db.query(`SELECT 1 FROM users WHERE email = @0`, [
      email,
    ]);
    if (exists.length > 0) continue;

    const randomDept =
      departments[Math.floor(Math.random() * departments.length)];
    const validPositions = positions.filter(
      (p) => p.department_id === randomDept.id,
    );

    if (validPositions.length === 0) continue;
    const randomPos =
      validPositions[Math.floor(Math.random() * validPositions.length)];

    const userId = faker.string.uuid();
    await db.query(
      `INSERT INTO users (id, name, email, password_hash, is_active)
       VALUES (@0, @1, @2, @3, 1)`,
      [userId, fullName, email, password],
    );

    const nip = faker.string.numeric(10); 
    const gender = faker.helpers.arrayElement(['Male', 'Female']);
    const status = faker.helpers.arrayElement(['Permanent', 'Contract']);
    const joinDate = faker.date.past({ years: 5 });
    const employeeId = randomUUID();

    await db.query(
      `INSERT INTO employees (
        id, user_id, department_id, full_name, nip, 
        gender, position_id, date_of_joining, date_of_active_position, 
        employee_status, is_active
      )
      VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, 1)`,
      [
        employeeId,
        userId,
        randomDept.id,
        fullName,
        nip,
        gender,
        randomPos.id,
        joinDate,
        joinDate, 
        status,
      ],
    );

    await db.query(
      `INSERT INTO position_histories (
        id, employee_id, position_id, date_of_active_position, is_active
      )
      VALUES (@0, @1, @2, @3, 1)`,
      [randomUUID(), employeeId, randomPos.id, joinDate],
    );

    await db.query(
      `INSERT INTO user_roles (id, user_id, role_id)
       VALUES (@0, @1, @2)`,
      [randomUUID(), userId, staffRoleId],
    );
  }

  console.log('✅ 100 Employees seeded with full profile');
}
