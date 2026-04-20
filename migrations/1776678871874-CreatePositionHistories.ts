import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePositionHistories1776678871874 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE position_histories (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        employee_id UNIQUEIDENTIFIER NOT NULL,
        position_id UNIQUEIDENTIFIER NOT NULL,
        date_of_active_position DATE NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,

        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),

        CONSTRAINT fk_pos_hist_emp FOREIGN KEY (employee_id) REFERENCES employees(id),
        CONSTRAINT fk_pos_hist_pos FOREIGN KEY (position_id) REFERENCES positions(id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_pos_hist_emp ON position_histories(employee_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_pos_hist_pos ON position_histories(position_id)
    `);

    await queryRunner.query(`
    CREATE INDEX idx_pos_hist_active
    ON position_histories(employee_id, is_active)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE position_histories`);
  }
}
