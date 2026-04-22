import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DataSource,
  ILike,
  type FindOptionsOrder,
  type FindOptionsWhere,
} from 'typeorm';
import { EmployeeRepository } from './repositories/employee.repository';
import { Employee } from './entities/employee.entity';
import { PositionHistory } from './entities/position-history.entity';
import {
  createPaginationMeta,
  type PaginatedResponse,
} from 'src/common/http/response';
import type {
  CreateEmployeeDto,
  ListEmployeeDto,
  UpdateEmployeeDto,
} from './schemas/employee.schemas';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly employeeRepo: EmployeeRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(data: CreateEmployeeDto): Promise<Employee> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const employee = this.employeeRepo.create(data);
      const savedEmployee = await queryRunner.manager.save(Employee, employee);

      // Simpan history awal tanpa instantiate entity class
      await queryRunner.manager.insert(PositionHistory, {
        employeeId: savedEmployee.id,
        positionId: savedEmployee.positionId,
        dateOfActivePosition: savedEmployee.dateOfActivePosition,
        isActive: true,
      });

      await queryRunner.commitTransaction();
      return savedEmployee;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private buildWhere(
    query: ListEmployeeDto,
  ): FindOptionsWhere<Employee> | FindOptionsWhere<Employee>[] {
    const { q, search, isActive } = query;
    const term = (search ?? q)?.trim();

    let where: FindOptionsWhere<Employee> | FindOptionsWhere<Employee>[] = {};

    if (term && term.length > 0) {
      const pattern = `%${term}%`;
      where = [{ fullName: ILike(pattern) }, { nip: ILike(pattern) }];
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
    query: ListEmployeeDto = {} as ListEmployeeDto,
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, sort = 'createdAt:desc' } = query;

    // 1. Handling Sort
    const [sortField, sortDirRaw] = sort.split(':');
    const sortDir = sortDirRaw?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'fullName',
      'nip',
    ] as const;
    const orderField = allowedSortFields.includes(sortField as any)
      ? sortField
      : 'createdAt';

    const skip = (page - 1) * limit;

    // 2. Build Query dengan QueryBuilder
    const queryBuilder = this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoin('employee.position', 'position') // Gunakan leftJoin (bukan JoinAndSelect)
      .select([
        'employee.id AS id',
        'employee.fullName AS "fullName"',
        'employee.nip AS nip',
        'employee.gender AS gender',
        'employee.dateOfJoining AS "dateOfJoining"',
        'employee.dateOfActivePosition AS "dateOfActivePosition"',
        'employee.positionId AS "positionId"',
        'employee.employeeStatus AS "employeeStatus"',
        'employee.isActive AS "isActive"',
        'employee.createdAt AS "createdAt"',
        'employee.updatedAt AS "updatedAt"',
        'position.name AS "positionName"', // Menarik name dari tabel position
      ])
      .where(this.buildWhere(query))
      // Pastikan menggunakan alias yang sesuai untuk ordering di QueryBuilder
      .orderBy(`employee.${orderField}`, sortDir)
      .offset(skip)
      .limit(limit);

    // 3. Eksekusi query untuk data dan total count
    const [rawItems, total] = await Promise.all([
      queryBuilder.getRawMany(),
      queryBuilder.getCount(),
    ]);

    return {
      items: rawItems,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id },
      relations: ['department', 'position', 'manager'],
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async findPositionHistories(employeeId: string) {
    return await this.dataSource
      .getRepository(PositionHistory)
      .createQueryBuilder('ph') // Alias untuk positionHistories
      .select([
        'ph.id AS id',
        'ph.employeeId AS employeeId',
        'employee.fullName AS employeeFullName',
        'ph.dateOfActivePosition AS dateOfActivePosition',
        'ph.positionId AS positionId',
        'position.name AS positionName',
      ])
      .leftJoin('ph.employee', 'employee') // Asumsi ada relasi 'employee' di entitas
      .leftJoin('ph.position', 'position') // Asumsi ada relasi 'position' di entitas
      .where('ph.employeeId = :employeeId', { employeeId })
      .orderBy('ph.createdAt', 'DESC')
      .getRawMany();
  }

  async update(id: string, data: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);
    const oldPositionId = employee.positionId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(employee, data);
      const updatedEmployee = await queryRunner.manager.save(
        Employee,
        employee,
      );

      // Jika posisi berubah, buat history baru
      if (data.positionId && data.positionId !== oldPositionId) {
        await queryRunner.manager.update(
          PositionHistory,
          { employeeId: id },
          { isActive: false },
        );
        await queryRunner.manager.insert(PositionHistory, {
          employeeId: id,
          positionId: data.positionId,
          dateOfActivePosition: data.dateOfActivePosition || new Date(),
          isActive: true,
        });
      }

      await queryRunner.commitTransaction();
      return updatedEmployee;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepo.softRemove(employee);
  }
}
