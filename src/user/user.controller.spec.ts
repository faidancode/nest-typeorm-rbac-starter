import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { randomUUID } from 'crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';

describe('UserControllerTest', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  const mockId = randomUUID();
  const mockUser = { id: mockId, email: 'test@example.com' };

  beforeEach(async () => {
    const serviceMock: Partial<Record<keyof UserService, any>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
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

    controller = module.get<UserController>(UserController);
    service = module.get(UserService) as jest.Mocked<UserService>;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('UserController_FindAll', () => {
    it('should call service.findAll', async () => {
      service.findAll.mockResolvedValue([mockUser] as any);
      const result = await controller.findAll();
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('UserController_Create', () => {
    it('should create a user (Positive)', async () => {
      const payload = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      service.create.mockResolvedValue(mockUser as any);

      const result = await controller.create(payload);

      expect(service.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockUser);
    });

    it('should throw conflict if email exists (Negative)', async () => {
      const payload = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
      };

      service.create.mockRejectedValue(new ConflictException());

      await expect(controller.create(payload)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('UserController_FindOne', () => {
    it('should return user by id (Positive)', async () => {
      service.findOne.mockResolvedValue(mockUser as any);
      const result = await controller.findOne(mockId);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if service fails (Negative)', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(mockId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UserController_Update', () => {
    it('should update user and return result (Positive)', async () => {
      const payload = { email: 'updated@example.com' };
      service.update.mockResolvedValue({ ...mockUser, ...payload } as any);

      const result = await controller.update(mockId, payload);
      expect(result).toMatchObject(payload);
    });
  });

  describe('UserController_Remove', () => {
    it('should successfully call remove (Positive)', async () => {
      service.remove.mockResolvedValue(undefined);
      await controller.remove(mockId);
      expect(service.remove).toHaveBeenCalledWith(mockId);
    });
  });
});
