import { Test, TestingModule } from '@nestjs/testing';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';
import { randomUUID } from 'crypto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import { Position } from './entities/position.entity';

describe('PositionControllerTest', () => {
  let controller: PositionController;
  let service: jest.Mocked<PositionService>;

  const mockId = randomUUID();
  const mockPosition: Position = {
    id: mockId,
    name: 'Software Engineer',
    departmentId: randomUUID(), // Gunakan camelCase sesuai dekorator @Column
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    // department: ... (optional, bisa dikosongkan jika tidak sedang test relation)
  };

  beforeEach(async () => {
    // Mocking Service sesuai pola Partial Record
    const serviceMock: Partial<Record<keyof PositionService, any>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionController],
      providers: [
        {
          provide: PositionService,
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
          useValue: { createForUser: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<PositionController>(PositionController);
    service = module.get(PositionService) as jest.Mocked<PositionService>;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('PositionController_Create', () => {
    it('should call service.create with payload', async () => {
      const body = {
        name: 'Software Engineer',
        departmentId: randomUUID(),
      };
      service.create.mockResolvedValue(mockPosition as Position);

      const result = await controller.create(body);

      expect(service.create).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockPosition);
    });

    it('should throw error if service fails (Negative)', async () => {
      service.create.mockRejectedValue(new ConflictException());
      await expect(
        controller.create({ name: 'Duplicate', departmentId: randomUUID() }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('PositionController_FindOne', () => {
    it('should return a position by ID (Positive)', async () => {
      service.findOne.mockResolvedValue(mockPosition as any);
      const result = await controller.findOne(mockId);
      expect(result).toEqual(mockPosition);
      expect(service.findOne).toHaveBeenCalledWith(mockId);
    });

    it('should throw NotFoundException (Negative)', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(mockId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PositionController_Update', () => {
    it('should return updated position', async () => {
      const body = { name: 'Lead' };
      service.update.mockResolvedValue({ ...mockPosition, ...body } as any);

      const result = await controller.update(mockId, body);
      expect(result.name).toBe('Lead');
      expect(service.update).toHaveBeenCalledWith(mockId, body);
    });
  });

  describe('PositionController_Remove', () => {
    it('should call service.remove and return undefined', async () => {
      service.remove.mockResolvedValue(undefined);
      const result = await controller.remove(mockId);
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockId);
    });
  });
});
