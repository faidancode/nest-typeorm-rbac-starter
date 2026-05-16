import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findWithEmployee(userId: string) {
    const result = await this.createQueryBuilder('u')
      .select([
        'u.id AS id',
        'u.email AS email',
        'e.position_id AS position_id',
        'e.department_id AS department_id',
      ])
      .leftJoin('employees', 'e', 'e.user_id = u.id')
      .where('u.id = :userId', { userId })
      .getRawOne();

    return result;
  }

  async findRolesByUserIds(
    userIds: string[],
  ): Promise<
    {
      user_id: string;
      role_id: string;
      role_name: string;
      role_description: string | null;
    }[]
  > {
    if (!userIds || userIds.length === 0) return [];

    const placeholders = userIds.map((_, i) => `@${i}`).join(', ');
    const query = `
      SELECT 
        ur.user_id, 
        r.id as role_id,
        r.name as role_name
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id IN (${placeholders})
    `;
    return this.query(query, userIds);
  }

  async assignRoles(userId: string, roleIds: string[]) {
    await this.dataSource.transaction(async (manager) => {
      for (const roleId of roleIds) {
        await manager.query(
          `
          INSERT INTO user_roles (id, user_id, role_id)
          SELECT NEWID(), @0, @1
          WHERE NOT EXISTS (
            SELECT 1
            FROM user_roles
            WHERE user_id = @0
              AND role_id = @1
          )
          `,
          [userId, roleId],
        );
      }
    });

    return { success: true };
  }
}
