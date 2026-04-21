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
}
