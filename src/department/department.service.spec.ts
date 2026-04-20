import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentService } from './department.service';
import { DepartmentRepository } from './repositories/department.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('DepartmentServiceTest', () => {
  let service: DepartmentService;
  let departmentRepo: jest.Mocked<
    Pick<
      DepartmentRepository,
      'create' | 'save' | 'find' | 'findOne' | 'softRemove'
    >
  >;

  const mockId = randomUUID();
  const mockDepartment = {
    id: mockId,
    name: 'IT Department',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    departmentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: DepartmentRepository,
          useValue: departmentRepo,
        },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('DepartmentService_Create', () => {
    const payload = { name: 'IT Department' };

    it('should create a new department successfully (Positive)', async () => {
      departmentRepo.findOne.mockResolvedValue(null);
      departmentRepo.create.mockReturnValue(mockDepartment as any);
      departmentRepo.save.mockResolvedValue(mockDepartment as any);

      const result = await service.create(payload);

      expect(departmentRepo.findOne).toHaveBeenCalledWith({
        where: { name: payload.name },
      });
      expect(result).toEqual(mockDepartment);
    });

    it('should throw ConflictException if department name exists (Negative)', async () => {
      departmentRepo.findOne.mockResolvedValue(mockDepartment as any);

      await expect(service.create(payload)).rejects.toThrow(ConflictException);
    });
  });

  describe('DepartmentService_FindAll', () => {
    it('should return an array of departments', async () => {
      departmentRepo.find.mockResolvedValue([mockDepartment] as any);
      const result = await service.findAll();
      expect(result).toEqual([mockDepartment]);
    });
  });

  describe('DepartmentService_FindOne', () => {
    it('should return a department if found (Positive)', async () => {
      departmentRepo.findOne.mockResolvedValue(mockDepartment as any);
      const result = await service.findOne(mockId);
      expect(result).toEqual(mockDepartment);
    });

    it('should throw NotFoundException if department not found (Negative)', async () => {
      departmentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(mockId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('DepartmentService_Update', () => {
    const updatePayload = { name: 'HR Department' };

    it('should update department successfully (Positive)', async () => {
      departmentRepo.findOne.mockResolvedValueOnce(mockDepartment as any); // Untuk findOne internal
      departmentRepo.findOne.mockResolvedValueOnce(null); // Untuk cek conflict name
      departmentRepo.save.mockResolvedValue({
        ...mockDepartment,
        ...updatePayload,
      } as any);

      const result = await service.update(mockId, updatePayload);
      expect(result.name).toBe(updatePayload.name);
    });

    it('should throw ConflictException if new name is already taken (Negative)', async () => {
      departmentRepo.findOne.mockResolvedValueOnce(mockDepartment as any);
      departmentRepo.findOne.mockResolvedValueOnce({
        id: 'other-id',
        name: 'HR',
      } as any);

      await expect(service.update(mockId, { name: 'HR' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('DepartmentService_Remove', () => {
    it('should soft remove department (Positive)', async () => {
      departmentRepo.findOne.mockResolvedValue(mockDepartment as any);
      departmentRepo.softRemove.mockResolvedValue(undefined as any);

      await service.remove(mockId);
      expect(departmentRepo.softRemove).toHaveBeenCalledWith(mockDepartment);
    });
  });
});
