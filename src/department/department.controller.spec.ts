import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { randomUUID } from 'crypto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';

describe('DepartmentControllerTest', () => {
  let controller: DepartmentController;
  let service: jest.Mocked<DepartmentService>;

  const mockId = randomUUID();
  const mockDepartment = { id: mockId, name: 'IT' };
  const allowReq = {
    ability: {
      can: jest.fn().mockReturnValue(true),
    },
  };

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
          useValue: {
            createForUser: jest.fn(),
          },
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
      const result = await controller.findOne(mockId, allowReq as any);
      expect(result).toEqual(mockDepartment);
    });

    it('should return 404 if not found (Negative)', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(mockId, allowReq as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DepartmentController_Update', () => {
    it('should return updated department (Positive)', async () => {
      const body = { name: 'Updated IT' };
      service.update.mockResolvedValue({ ...mockDepartment, ...body } as any);

      const result = await controller.update(mockId, body, allowReq as any);
      expect(result.name).toBe('Updated IT');
    });
  });

  describe('DepartmentController_Remove', () => {
    it('should successfully remove (Positive)', async () => {
      service.remove.mockResolvedValue(undefined);
      const result = await controller.remove(mockId, allowReq as any);
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockId);
    });
  });
});
