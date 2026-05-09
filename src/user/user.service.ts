import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import type { CreateUserDto, UpdateUserDto } from './schemas/user.schemas';
import { AuditService } from 'src/common/logging/audit.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly audit: AuditService,
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

    const saved = await this.userRepo.save(user);

    this.audit.record({
      action: 'create',
      resource: 'user',
      resourceId: saved.id,
      after: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        isActive: saved.isActive,
      },
    });

    return saved;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepo.find();
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
    const before = {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
    };

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepo.findByEmail(data.email);
      if (existing) throw new ConflictException('Email already in use');
    }

    Object.assign(user, data);
    const saved = await this.userRepo.save(user);

    this.audit.record({
      action: 'update',
      resource: 'user',
      resourceId: id,
      before,
      after: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        isActive: saved.isActive,
      },
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    this.audit.record({
      action: 'delete',
      resource: 'user',
      resourceId: id,
      before: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
    await this.userRepo.softRemove(user);
  }
}
