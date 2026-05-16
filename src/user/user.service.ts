import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ILike, type FindOptionsOrder, type FindOptionsWhere } from 'typeorm';
import { UserRepository } from './repositories/user.repository';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RoleService } from 'src/role/services/role.service';
import {
  createPaginationMeta,
  type PaginatedResponse,
} from 'src/common/http/response';
import type {
  AssignUserRoleDto,
  CreateUserDto,
  ListUserDto,
  UpdateUserDto,
  UserRoleSummary,
} from './schemas/user.schemas';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly roleService: RoleService,
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      isActive: data.isActive ?? true,
    });

    return await this.userRepo.save(user);
  }

  private buildWhere(
    query: ListUserDto,
  ): FindOptionsWhere<User> | FindOptionsWhere<User>[] {
    const { q, search, isActive } = query;
    const term = (search ?? q)?.trim();

    let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = {};

    if (term && term.length > 0) {
      const pattern = `%${term}%`;
      where = [{ name: ILike(pattern) }, { email: ILike(pattern) }];
    }

    if (typeof isActive === 'boolean') {
      if (Array.isArray(where)) {
        where = where.map((condition) => ({ ...condition, isActive }));
      } else {
        where.isActive = isActive;
      }
    }

    return where;
  }

  async findAll(
    query: ListUserDto = {} as ListUserDto,
  ): Promise<PaginatedResponse<User[]>> {
    const { page = 1, limit = 10, sort = 'createdAt:desc' } = query;
    const [sortField, sortDirRaw] = sort.split(':');
    const sortDir = sortDirRaw?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'name',
      'email',
    ] as const;
    const orderField = allowedSortFields.includes(
      sortField as (typeof allowedSortFields)[number],
    )
      ? (sortField as (typeof allowedSortFields)[number])
      : 'createdAt';

    const where = this.buildWhere(query);
    const skip = (page - 1) * limit;
    const order: FindOptionsOrder<User> = {
      [orderField]: sortDir,
    };

    const [items, total] = await this.userRepo.findAndCount({
      where,
      order,
      take: limit,
      skip,
    });

    if (items.length > 0) {
      const userIds = items.map((u) => u.id);
      const rolesData = await this.userRepo.findRolesByUserIds(userIds);

      const rolesMap = rolesData.reduce(
        (acc, row) => {
          if (!acc[row.user_id]) acc[row.user_id] = [];
          acc[row.user_id].push({
            id: row.role_id,
            name: row.role_name,
          });
          return acc;
        },
        {} as Record<string, UserRoleSummary[]>,
      );

      items.forEach((user) => {
        (user as any).roles = rolesMap[user.id] || [];
      });
    }

    return {
      items,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepo.findByEmail(data.email);
      if (existing) throw new ConflictException('Email already in use');
    }

    Object.assign(user, data);
    return await this.userRepo.save(user);
  }

  async assignRole(id: string, data: AssignUserRoleDto) {
    await this.findOne(id);
    const uniqueRoleIds = [...new Set(data.roleIds)];

    await Promise.all(
      uniqueRoleIds.map((roleId) => this.roleService.findById(roleId)),
    );

    return this.userRepo.assignRoles(id, uniqueRoleIds);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.softRemove(user);
  }
}
