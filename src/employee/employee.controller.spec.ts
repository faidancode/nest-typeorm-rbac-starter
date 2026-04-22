import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { randomUUID } from 'crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeesController } from './employee.controller';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './schemas/employee.schemas';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: EmployeeService;

  const id = randomUUID();
  const departmentId = randomUUID();
  const positionId = randomUUID();

  const mockEmployee: CreateEmployeeDto & { id: string } = {
    id,
    fullName: 'Jane Doe',
    nip: '1234567890',
    gender: 'Perempuan',
    positionId: positionId,
    departmentId: departmentId,
    managerId: null,
    dateOfJoining: new Date(),
    dateOfActivePosition: new Date(),
    employeeStatus: 'Permanen',
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeeService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findPositionHistories: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: PoliciesGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: CaslAbilityFactory,
          useValue: { createForUser: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
    service = module.get<EmployeeService>(EmployeeService);
  });

  describe('create', () => {
    it('should return created employee (Positive)', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockEmployee as Employee);
      expect(await controller.create(mockEmployee)).toEqual(mockEmployee);
    });

    it('should throw error if creation fails (Negative)', async () => {
      jest
        .spyOn(service, 'create')
        .mockRejectedValue(new BadRequestException('NIP already exists'));
      await expect(controller.create(mockEmployee)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return an employee (Positive)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployee as any);
      expect(await controller.findOne(id)).toEqual(mockEmployee);
    });

    it('should throw NotFoundException if employee not found (Negative)', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return employees with pagination meta', async () => {
      const query = {
        search: 'Jane',
        isActive: 'true',
        sort: 'fullName:asc',
        page: '2',
        limit: '5',
      };

      const mockResult = {
        items: [mockEmployee],
        meta: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult as any);

      const result = await controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith({
        search: 'Jane',
        isActive: true,
        sort: 'fullName:asc',
        page: 2,
        limit: 5,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('findHistories', () => {
    it('should return array of histories (Positive)', async () => {
      const mockHistories = [{ id: 'hist1', positionName: 'Staff' }];
      jest
        .spyOn(service, 'findPositionHistories')
        .mockResolvedValue(mockHistories as any);

      const result = await controller.findHistories(id);
      expect(result).toEqual(mockHistories);
    });

    it('should throw error if employee id is invalid (Negative/Edge Case)', async () => {
      jest
        .spyOn(service, 'findPositionHistories')
        .mockRejectedValue(new NotFoundException());
      await expect(controller.findHistories(id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update employee (Positive)', async () => {
      const updateDto = { fullName: 'Updated Name' };
      const updatedEmployee = { ...mockEmployee, ...updateDto };

      jest.spyOn(service, 'update').mockResolvedValue(updatedEmployee as any);

      const result = await controller.update(id, updateDto);

      // PERBAIKAN: Gunakan toMatchObject untuk mengecek partial object
      expect(result).toMatchObject({
        fullName: 'Updated Name',
      });
      expect(result).toEqual(updatedEmployee);
    });

    it('should throw NotFoundException if update target missing (Negative)', async () => {
      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException());
      await expect(
        controller.update(id, { fullName: 'Ghost' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should return void on success (Positive)', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      expect(await controller.remove(id)).toBeUndefined();
    });

    it('should throw error if delete fails (Negative)', async () => {
      jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException());
      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    });
  });
});
