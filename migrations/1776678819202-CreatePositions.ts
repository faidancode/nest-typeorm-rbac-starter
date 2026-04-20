import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePositions1776678819202 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE positions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        department_id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(100) NOT NULL UNIQUE,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        deleted_at DATETIME2 NULL

        -- Tambahkan constraint agar relasi terjaga
        CONSTRAINT FK_positions_department FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE positions`);
  }
}
