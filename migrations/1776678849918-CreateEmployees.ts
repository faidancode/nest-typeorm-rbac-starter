import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployees1776678849918 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE employees (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

        user_id UNIQUEIDENTIFIER NULL UNIQUE,
        department_id UNIQUEIDENTIFIER NULL,
        manager_id UNIQUEIDENTIFIER NULL,

        full_name NVARCHAR(120) NOT NULL,
        nip NVARCHAR(30) NOT NULL UNIQUE,
        gender NVARCHAR(20) NOT NULL CHECK (gender IN ('Male','Female')),

        position_id UNIQUEIDENTIFIER NOT NULL,
        date_of_joining DATE NOT NULL,
        date_of_active_position DATE NOT NULL,

        employee_status NVARCHAR(50) NOT NULL CHECK (employee_status IN ('Permanent','Contract')),
        is_active BIT NOT NULL DEFAULT 1,

        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        deleted_at DATETIME2 NULL

        CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES departments(id),
        CONSTRAINT fk_employee_manager FOREIGN KEY (manager_id) REFERENCES employees(id),
        CONSTRAINT fk_employee_position FOREIGN KEY (position_id) REFERENCES positions(id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_employees_position_id ON employees(position_id)
    `);

    await queryRunner.query(`
        CREATE INDEX idx_employees_user_id ON employees(user_id)
    `);

    await queryRunner.query(`
        CREATE INDEX idx_employees_manager_id ON employees(manager_id)
    `);

    await queryRunner.query(`
        CREATE INDEX idx_employees_department_id ON employees(department_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE employees`);
  }
}
