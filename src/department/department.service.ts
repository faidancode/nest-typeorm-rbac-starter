import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DepartmentRepository } from './repositories/department.repository';
import { Department } from './entities/department.entity';
import { AuditService } from 'src/common/logging/audit.service';

@Injectable()
export class DepartmentService {
  constructor(
    private readonly departmentRepo: DepartmentRepository,
    private readonly audit: AuditService,
  ) {}

  async create(data: Partial<Department>): Promise<Department> {
    const existing = await this.departmentRepo.findOne({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException('Department name already exists');
    }
    const department = this.departmentRepo.create(data);
    const saved = await this.departmentRepo.save(department);

    this.audit.record({
      action: 'create',
      resource: 'department',
      resourceId: saved.id,
      after: saved,
    });

    return saved;
  }

  async findAll(): Promise<Department[]> {
    return await this.departmentRepo.find();
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  async update(id: string, data: Partial<Department>): Promise<Department> {
    const department = await this.findOne(id);
    const before = { ...department };

    if (data.name && data.name !== department.name) {
      const existing = await this.departmentRepo.findOne({
        where: { name: data.name },
      });
      if (existing)
        throw new ConflictException('New department name already exists');
    }

    Object.assign(department, data);
    const saved = await this.departmentRepo.save(department);

    this.audit.record({
      action: 'update',
      resource: 'department',
      resourceId: id,
      before,
      after: saved,
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);
    this.audit.record({
      action: 'delete',
      resource: 'department',
      resourceId: id,
      before: department,
    });
    await this.departmentRepo.softRemove(department);
  }
}
