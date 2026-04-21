import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RoleRepository {
  constructor(private readonly db: DataSource) {}

  async create(payload: { name: string; description?: string }) {
    const result = await this.db.query(
      `
      INSERT INTO roles (name, description)
      OUTPUT INSERTED.*
      VALUES (@0, @1)
      `,
      [payload.name, payload.description ?? null],
    );

    return result[0];
  }

  async findAllWithPermissions() {
    return this.db.query(`
      SELECT 
        r.id as role_id,
        r.name as role_name,
        p.action,
        s.name as scope
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      LEFT JOIN scopes s ON s.id = rp.scope_id
    `);
  }

  async findByIdWithPermissions(id: string) {
    const rows = await this.db.query(
      `
      SELECT 
        r.id,
        r.name,
        r.description,
        p.action,
        s.name as scope
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      LEFT JOIN scopes s ON s.id = rp.scope_id
      WHERE r.id = @0
      `,
      [id],
    );

    return rows.length ? rows : null;
  }

  async update(id: string, payload: any) {
    await this.db.query(
      `
      UPDATE roles
      SET name = @1,
          description = @2
      WHERE id = @0
      `,
      [id, payload.name, payload.description ?? null],
    );

    return this.findByIdWithPermissions(id);
  }

  async delete(id: string) {
    await this.db.query(`DELETE FROM roles WHERE id = @0`, [id]);
    return { success: true };
  }

  async assignPermissions(
    roleId: string,
    items: { permissionId: string; scopeId: string }[],
  ) {
    // clear existing
    await this.db.query(`DELETE FROM role_permissions WHERE role_id = @0`, [
      roleId,
    ]);

    for (const item of items) {
      await this.db.query(
        `
        INSERT INTO role_permissions (role_id, permission_id, scope_id)
        VALUES (@0, @1, @2)
        `,
        [roleId, item.permissionId, item.scopeId],
      );
    }

    return { success: true };
  }
}
