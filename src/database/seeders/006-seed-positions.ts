import { DataSource } from 'typeorm';
import { insertIfNotExists } from './base/upsert.helper';
import { randomUUID } from 'crypto';

export async function seedPositions(db: DataSource) {
  // 1. Ambil semua departemen untuk mendapatkan ID-nya
  const departments = await db.query(`SELECT id, name FROM departments`);

  // Helper untuk mencari ID berdasarkan nama
  const getDeptId = (name: string) =>
    departments.find((d: any) => d.name === name)?.id;

  const positionsToSeed = [
    {
      id: randomUUID(),
      department_id: getDeptId('Engineering'),
      name: 'Software Engineer',
    },
    { id: randomUUID(), department_id: getDeptId('HR'), name: 'HR Manager' },
    {
      id: randomUUID(),
      department_id: getDeptId('HR'),
      name: 'HR Staff',
    },
    {
      id: randomUUID(),
      department_id: getDeptId('Finance'),
      name: 'Accountant',
    },
    {
      id: randomUUID(),
      department_id: getDeptId('Production'),
      name: 'Operator',
    },
  ];

  // 2. Filter hanya jika department_id ditemukan (mencegah error FK)
  const validPositions = positionsToSeed.filter((p) => p.department_id);

  await insertIfNotExists(db, 'positions', 'name', validPositions);
}
