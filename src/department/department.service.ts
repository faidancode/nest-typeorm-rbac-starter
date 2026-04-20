import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DepartmentRepository } from './repositories/department.repository';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentService {
  constructor(private readonly departmentRepo: DepartmentRepository) {}

  async create(data: Partial<Department>): Promise<Department> {
    const existing = await this.departmentRepo.findOne({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictException('Department name already exists');
    }
    const department = this.departmentRepo.create(data);
    return await this.departmentRepo.save(department);
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

    if (data.name && data.name !== department.name) {
      const existing = await this.departmentRepo.findOne({
        where: { name: data.name },
      });
      if (existing)
        throw new ConflictException('New department name already exists');
    }

    Object.assign(department, data);
    return await this.departmentRepo.save(department);
  }

  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);
    await this.departmentRepo.softRemove(department);
  }
}
