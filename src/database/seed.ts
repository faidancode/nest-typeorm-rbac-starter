import { seedScopes } from './seeders/001-seed-scopes';
import { seedPermissions } from './seeders/002-seed-permissions';
import { seedRoles } from './seeders/003-seed-roles';
import { seedRolePermissions } from './seeders/004-seed-role-permissions';
import { seedDepartments } from './seeders/005-seed-departments';
import { seedPositions } from './seeders/006-seed-positions';
import { seedUsers } from './seeders/007-seed-users';
import { seedEmployeesFaker } from './seeders/008-seed-employees-faker';
import { seedUserRoles } from './seeders/009-seed-user-roles';

export async function runSeed(db) {
  await seedScopes(db);
  await seedPermissions(db);
  await seedRoles(db);
  await seedRolePermissions(db);
  await seedDepartments(db);
  await seedPositions(db);
  await seedUsers(db);
  await seedUserRoles(db);

  // 🔥 faker
  await seedEmployeesFaker(db);

  console.log('✅ ALL SEED DONE');
}
