import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { randomUUID } from 'crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/casl/policies.guard';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';
import { RoleService } from 'src/role/services/role.service';

describe('UserControllerTest', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;
  let roleService: jest.Mocked<RoleService>;

  const mockId = randomUUID();
  const mockUser = { id: mockId, email: 'test@example.com' };

  beforeEach(async () => {
    const serviceMock: Partial<Record<keyof UserService, any>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      assignRole: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const roleServiceMock: Partial<Record<keyof RoleService, any>> = {
      findAllForSelect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: serviceMock,
        },
        {
          provide: RoleService,
          useValue: roleServiceMock,
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
    roleService = module.get(RoleService) as jest.Mocked<RoleService>;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('UserController_FindAll', () => {
    it('should call service.findAll', async () => {
      const query = {
        search: 'test',
        isActive: 'true',
        sort: 'email:asc',
        page: '2',
        limit: '5',
      };

      service.findAll.mockResolvedValue({
        items: [mockUser],
        meta: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      } as any);
      const result = await controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith({
        search: 'test',
        isActive: true,
        sort: 'email:asc',
        page: 2,
        limit: 5,
      });
      expect(result).toEqual({
        items: [mockUser],
        meta: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('UserController_FindRoles', () => {
    it('should return a list of roles for select inputs', async () => {
      const roles = [
        {
          role_id: 'role-1',
          role_name: 'admin',
          role_description: 'Full access',
        },
      ];

      roleService.findAllForSelect.mockResolvedValue(roles as any);

      const result = await controller.findRoles();

      expect(roleService.findAllForSelect).toHaveBeenCalled();
      expect(result).toEqual(roles);
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

  describe('UserController_AssignRole', () => {
    it('should assign role to user', async () => {
      const payload = { roleIds: [randomUUID(), randomUUID()] };
      service.assignRole.mockResolvedValue({ success: true } as any);

      const result = await controller.assignRole(mockId, payload);

      expect(service.assignRole).toHaveBeenCalledWith(mockId, payload);
      expect(result).toEqual({ success: true });
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
