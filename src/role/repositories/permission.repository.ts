import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PermissionRepository {
  constructor(private readonly db: DataSource) {}

  async checkPermissionScope(permissionId: string, scopeId: string) {
    const permission = await this.db.query(
      `SELECT id FROM permissions WHERE id = @0`,
      [permissionId],
    );

    const scope = await this.db.query(`SELECT id FROM scopes WHERE id = @0`, [
      scopeId,
    ]);

    return permission.length > 0 && scope.length > 0;
  }

  async getUserPermissions(userId: string) {
    return this.db.query(
      `
      SELECT 
        p.action,
        s.name as scope,
        s.priority
      FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      JOIN scopes s ON s.id = rp.scope_id
      WHERE ur.user_id = @0
      `,
      [userId],
    );
  }

  async findAll() {
    return this.db.query(`
    SELECT 
      p.id,
      p.action,
      p.description
    FROM permissions p
    ORDER BY p.action ASC
  `);
  }
}
