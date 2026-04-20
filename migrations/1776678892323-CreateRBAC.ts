import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRBAC1776678892323 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE roles (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE permissions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        action NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE scopes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(20) NOT NULL UNIQUE,
        priority INT NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE role_permissions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        role_id UNIQUEIDENTIFIER NOT NULL,
        permission_id UNIQUEIDENTIFIER NOT NULL,
        scope_id UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT uq_role_perm_scope UNIQUE (role_id, permission_id, scope_id),

        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id),
        FOREIGN KEY (scope_id) REFERENCES scopes(id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_roles (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        role_id UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT uq_user_role UNIQUE (user_id, role_id),

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    await queryRunner.query(`
    CREATE INDEX idx_user_roles_user ON user_roles(user_id)
    `);

    await queryRunner.query(`
    CREATE INDEX idx_role_permissions_role ON role_permissions(role_id)
    `);

    await queryRunner.query(`
    CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE user_roles`);
    await queryRunner.query(`DROP TABLE role_permissions`);
    await queryRunner.query(`DROP TABLE scopes`);
    await queryRunner.query(`DROP TABLE permissions`);
    await queryRunner.query(`DROP TABLE roles`);
  }
}
