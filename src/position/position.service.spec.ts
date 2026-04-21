import { Test, TestingModule } from '@nestjs/testing';
import { PositionService } from './position.service';
import { PositionRepository } from './repositories/position.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('PositionServiceTest', () => {
  let service: PositionService;
  let positionRepo: jest.Mocked<
    Pick<
      PositionRepository,
      'create' | 'save' | 'find' | 'findOne' | 'softRemove'
    >
  >;

  const mockId = randomUUID();
  const mockPosition = {
    id: mockId,
    name: 'Software Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    // Mocking Repository sesuai pola Pick
    positionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionService,
        {
          provide: PositionRepository,
          useValue: positionRepo,
        },
      ],
    }).compile();

    service = module.get<PositionService>(PositionService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('PositionService_Create', () => {
    const payload = { name: 'Software Engineer' };

    it('should create a new position successfully (Positive)', async () => {
      positionRepo.findOne.mockResolvedValue(null);
      positionRepo.create.mockReturnValue(mockPosition as any);
      positionRepo.save.mockResolvedValue(mockPosition as any);

      const result = await service.create(payload);

      expect(positionRepo.findOne).toHaveBeenCalledWith({
        where: { name: payload.name },
      });
      expect(result).toHaveProperty('id', mockId);
      expect(result.name).toBe(payload.name);
    });

    it('should throw ConflictException if position name already exists (Negative)', async () => {
      positionRepo.findOne.mockResolvedValue(mockPosition as any);

      await expect(service.create(payload)).rejects.toThrow(ConflictException);
    });
  });

  describe('PositionService_FindAll', () => {
    it('should return all positions', async () => {
      positionRepo.find.mockResolvedValue([mockPosition] as any);
      const result = await service.findAll();
      expect(result).toEqual([mockPosition]);
      expect(positionRepo.find).toHaveBeenCalled();
    });
  });

  describe('PositionService_FindOne', () => {
    it('should return a position if found (Positive)', async () => {
      positionRepo.findOne.mockResolvedValue(mockPosition as any);
      const result = await service.findOne(mockId);
      expect(result).toEqual(mockPosition);
    });

    it('should throw NotFoundException if position not found (Negative)', async () => {
      positionRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(mockId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PositionService_Update', () => {
    const updatePayload = { name: 'Senior Engineer' };

    it('should update position successfully (Positive)', async () => {
      positionRepo.findOne.mockResolvedValueOnce(mockPosition as any); // Untuk findOne internal
      positionRepo.findOne.mockResolvedValueOnce(null); // Untuk check conflict name
      positionRepo.save.mockResolvedValue({
        ...mockPosition,
        ...updatePayload,
      } as any);

      const result = await service.update(mockId, updatePayload);
      expect(result.name).toBe(updatePayload.name);
      expect(positionRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new name is already taken (Negative)', async () => {
      positionRepo.findOne.mockResolvedValueOnce(mockPosition as any);
      positionRepo.findOne.mockResolvedValueOnce({
        id: 'other-id',
        name: 'HR',
      } as any);

      await expect(service.update(mockId, { name: 'HR' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('PositionService_Remove', () => {
    it('should soft delete a position (Positive)', async () => {
      positionRepo.findOne.mockResolvedValue(mockPosition as any);
      positionRepo.softRemove.mockResolvedValue(undefined as any);

      await service.remove(mockId);
      expect(positionRepo.softRemove).toHaveBeenCalledWith(mockPosition);
    });

    it('should throw NotFoundException if position to remove not found (Negative)', async () => {
      positionRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(mockId)).rejects.toThrow(NotFoundException);
    });
  });
});
