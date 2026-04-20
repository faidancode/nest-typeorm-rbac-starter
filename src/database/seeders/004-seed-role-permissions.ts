import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

export async function seedRolePermissions(db: DataSource) {
  const [roles, permissions, scopes] = await Promise.all([
    db.query(`SELECT id, name FROM roles`),
    db.query(`SELECT id, action FROM permissions`),
    db.query(`SELECT id, name FROM scopes`),
  ]);

  const roleIdByName = new Map<string, string>(
    roles.map((role: any) => [role.name, role.id]),
  );
  const permissionIdByAction = new Map<string, string>(
    permissions.map((permission: any) => [permission.action, permission.id]),
  );
  const scopeIdByName = new Map<string, string>(
    scopes.map((scope: any) => [scope.name, scope.id]),
  );

  const allScopeId = scopeIdByName.get('all');
  if (!allScopeId) {
    throw new Error('Scope "all" not found');
  }

  const entries: Array<{
    roleName: string;
    permissionAction: string;
    scopeName: string;
  }> = [];

  const modules = ['employee', 'department', 'position', 'role', 'user'];
  const actions = ['create', 'read', 'update', 'delete'];

  for (const module of modules) {
    for (const action of actions) {
      entries.push({
        roleName: 'superadmin',
        permissionAction: `${module}.${action}`,
        scopeName: 'all',
      });
    }
  }

  for (const module of ['employee', 'department', 'position', 'role']) {
    for (const action of actions) {
      entries.push({
        roleName: 'admin',
        permissionAction: `${module}.${action}`,
        scopeName: 'all',
      });
    }
  }

  entries.push({
    roleName: 'admin',
    permissionAction: 'user.read',
    scopeName: 'all',
  });

  for (const module of ['employee', 'department', 'position', 'role']) {
    entries.push({
      roleName: 'staff',
      permissionAction: `${module}.read`,
      scopeName: 'all',
    });
  }

  const rows = entries
    .map((entry) => {
      const roleId = roleIdByName.get(entry.roleName);
      const permissionId = permissionIdByAction.get(entry.permissionAction);
      const scopeId = scopeIdByName.get(entry.scopeName) ?? allScopeId;

      if (!roleId || !permissionId || !scopeId) {
        return null;
      }

      return {
        roleId,
        permissionId,
        scopeId,
      };
    })
    .filter(Boolean) as Array<{
    roleId: string;
    permissionId: string;
    scopeId: string;
  }>;

  await db.query(`
    DELETE rp
    FROM role_permissions rp
    INNER JOIN roles r ON r.id = rp.role_id
    WHERE r.name IN ('superadmin', 'admin', 'staff')
  `);

  const values = rows
    .map(
      ({ roleId, permissionId, scopeId }) => `
        (${db.driver.options.type === 'mssql' ? 'NEWID()' : `'${randomUUID()}'`}, '${roleId}', '${permissionId}', '${scopeId}')
      `,
    )
    .join(',');

  if (!values.trim()) {
    return;
  }

  await db.query(`
    INSERT INTO role_permissions (id, role_id, permission_id, scope_id)
    SELECT v.id, v.role_id, v.permission_id, v.scope_id
    FROM (
      VALUES ${values}
    ) AS v(id, role_id, permission_id, scope_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = v.role_id
        AND rp.permission_id = v.permission_id
        AND rp.scope_id = v.scope_id
    )
  `);
}
