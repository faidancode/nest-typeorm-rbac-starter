import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { randomUUID } from 'crypto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('DepartmentControllerTest', () => {
  let controller: DepartmentController;
  let service: jest.Mocked<DepartmentService>;

  const mockId = randomUUID();
  const mockDepartment = { id: mockId, name: 'IT' };

  beforeEach(async () => {
    const serviceMock: Partial<Record<keyof DepartmentService, any>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        {
          provide: DepartmentService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
    service = module.get(DepartmentService) as jest.Mocked<DepartmentService>;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('DepartmentController_Create', () => {
    const body = { name: 'IT' };

    it('should call service.create with payload (Positive)', async () => {
      service.create.mockResolvedValue(mockDepartment as any);
      const result = await controller.create(body);
      expect(service.create).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockDepartment);
    });

    it('should throw error if service fails (Negative)', async () => {
      service.create.mockRejectedValue(new ConflictException());
      await expect(controller.create(body)).rejects.toThrow(ConflictException);
    });
  });

  describe('DepartmentController_FindOne', () => {
    it('should return a department (Positive)', async () => {
      service.findOne.mockResolvedValue(mockDepartment as any);
      const result = await controller.findOne(mockId);
      expect(result).toEqual(mockDepartment);
    });

    it('should return 404 if not found (Negative)', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(mockId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DepartmentController_Update', () => {
    it('should return updated department (Positive)', async () => {
      const body = { name: 'Updated IT' };
      service.update.mockResolvedValue({ ...mockDepartment, ...body } as any);

      const result = await controller.update(mockId, body);
      expect(result.name).toBe('Updated IT');
    });
  });

  describe('DepartmentController_Remove', () => {
    it('should successfully remove (Positive)', async () => {
      service.remove.mockResolvedValue(undefined);
      const result = await controller.remove(mockId);
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockId);
    });
  });
});
