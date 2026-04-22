import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from './repositories/employee.repository';
import { DataSource, QueryRunner } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Employee } from './entities/employee.entity';
import { PositionHistory } from './entities/position-history.entity';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let repo: EmployeeRepository;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let queryBuilder: any;

  const mockEmployee = {
    id: randomUUID(),
    fullName: 'John Doe',
    positionId: randomUUID(),
    departmentId: randomUUID(),
    dateOfActivePosition: new Date(),
  } as Employee;

  beforeEach(async () => {
    // Mock QueryRunner untuk Transaksi
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: EmployeeRepository,
          useValue: {
            create: jest.fn().mockReturnValue(mockEmployee),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            softRemove: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
            getRepository: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    repo = module.get<EmployeeRepository>(EmployeeRepository);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('create', () => {
    it('should successfully create employee and history (Positive)', async () => {
      (queryRunner.manager.save as jest.Mock).mockResolvedValue(mockEmployee);
      (queryRunner.manager.insert as jest.Mock).mockResolvedValue({
        identifiers: [{ id: randomUUID() }],
      });

      const result = await service.create(mockEmployee);

      expect(result).toEqual(mockEmployee);
      expect(queryRunner.manager.insert).toHaveBeenCalledWith(
        PositionHistory,
        expect.objectContaining({
          employeeId: mockEmployee.id,
          positionId: mockEmployee.positionId,
          dateOfActivePosition: mockEmployee.dateOfActivePosition,
          isActive: true,
        }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback and throw error if saving fails (Edge Case)', async () => {
      (queryRunner.manager.save as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(service.create(mockEmployee)).rejects.toThrow('DB Error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return employees with pagination meta and filters', async () => {
      const query = {
        search: 'John',
        isActive: true,
        sort: 'fullName:asc',
        page: 2,
        limit: 5,
      } as any;

      queryBuilder.getRawMany.mockResolvedValue([mockEmployee]);
      queryBuilder.getCount.mockResolvedValue(6);

      const result = await service.findAll(query);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('employee');
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'employee.position',
        'position',
      );
      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'employee.fullName',
        'ASC',
      );
      expect(queryBuilder.offset).toHaveBeenCalledWith(5);
      expect(queryBuilder.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        items: [mockEmployee],
        meta: {
          page: 2,
          limit: 5,
          total: 6,
          totalPages: 2,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return employee if found (Positive)', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockEmployee);
      expect(await service.findOne(mockEmployee.id)).toEqual(mockEmployee);
    });

    it('should throw NotFoundException if not found (Negative)', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should create new history if position changes (Positive)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployee);
      const updateData = { positionId: randomUUID() }; // ID Berbeda

      await service.update(mockEmployee.id, updateData);

      expect(queryRunner.manager.update).toHaveBeenCalled(); // Update is_active history lama
      expect(queryRunner.manager.insert).toHaveBeenCalledWith(
        PositionHistory,
        expect.objectContaining({
          employeeId: mockEmployee.id,
          positionId: updateData.positionId,
          isActive: true,
        }),
      );
    });

    it('should not create history if position remains the same (Edge Case)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployee);
      const updateData = { fullName: 'New Name' }; // positionId tetap

      await service.update(mockEmployee.id, updateData);

      expect(queryRunner.manager.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete employee if exists (Positive)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployee);
      await service.remove(mockEmployee.id);
      expect(repo.softRemove).toHaveBeenCalledWith(mockEmployee);
    });
  });
});
