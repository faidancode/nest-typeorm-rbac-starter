import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

export async function seedEmployeesFaker(db: DataSource) {
  const password = await bcrypt.hash('password123', 10);

  const departments = await db.query(`SELECT id FROM departments`);
  const positions = await db.query(`SELECT id, department_id FROM positions`);

  if (departments.length === 0 || positions.length === 0) {
    console.error('❌ Gagal: Seed department dan position dulu!');
    return;
  }

  for (let i = 0; i < 100; i++) {
    const email = faker.internet.email().toLowerCase();

    // 1. Cek User exist
    const exists = await db.query(`SELECT 1 FROM users WHERE email = @0`, [
      email,
    ]);
    if (exists.length > 0) continue;

    // 2. Pilih Random Dept & Position yang sesuai
    const randomDept =
      departments[Math.floor(Math.random() * departments.length)];
    const validPositions = positions.filter(
      (p) => p.department_id === randomDept.id,
    );

    if (validPositions.length === 0) continue;
    const randomPos =
      validPositions[Math.floor(Math.random() * validPositions.length)];

    // 3. Insert User
    const userId = faker.string.uuid();
    const fullName = faker.person.fullName();

    await db.query(
      `INSERT INTO users (id, name, email, password_hash, is_active)
       VALUES (@0, @1, @2, @3, 1)`,
      [userId, fullName, email, password],
    );

    // 4. Data Tambahan untuk Employee
    const nip = faker.string.numeric(10); // Contoh NIP 10 digit
    const gender = faker.helpers.arrayElement(['Male', 'Female']);
    const status = faker.helpers.arrayElement(['Permanent', 'Contract']);
    const joinDate = faker.date.past({ years: 5 });

    // 5. Insert Employee sesuai skema migrasi
    await db.query(
      `INSERT INTO employees (
        id, user_id, department_id, full_name, nip, 
        gender, position_id, date_of_joining, date_of_active_position, 
        employee_status, is_active
      )
      VALUES (NEWID(), @0, @1, @2, @3, @4, @5, @6, @7, @8, 1)`,
      [
        userId,
        randomDept.id,
        fullName,
        nip,
        gender,
        randomPos.id,
        joinDate,
        joinDate, // date_of_active_position disamakan dulu dengan join date
        status,
      ],
    );
  }

  console.log('✅ 100 Employees seeded with full profile');
}
