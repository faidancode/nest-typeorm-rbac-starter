import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { RoleService } from 'src/role/services/role.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UserServiceTest', () => {
  let service: UserService;
  let userRepo: jest.Mocked<
    Pick<
      UserRepository,
      | 'create'
      | 'findAndCount'
      | 'findOne'
      | 'save'
      | 'softRemove'
      | 'findByEmail'
      | 'findRolesByUserIds'
      | 'assignRoles'
    >
  >;
  let roleService: jest.Mocked<Pick<RoleService, 'findById'>>;

  const mockId = randomUUID();
  const mockUser = {
    id: mockId,
    email: 'test@example.com',
    passwordHash: 'hashed_pw',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepo = {
      create: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
      findByEmail: jest.fn(),
      findRolesByUserIds: jest.fn(),
      assignRoles: jest.fn(),
    };

    roleService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: userRepo,
        },
        {
          provide: RoleService,
          useValue: roleService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('UserService_FindAll', () => {
    it('should return users with pagination meta (Positive)', async () => {
      const query = {
        search: 'test',
        isActive: true,
        sort: 'email:asc',
        page: 2,
        limit: 5,
      } as any;

      userRepo.findAndCount.mockResolvedValue([[mockUser] as any, 6]);
      userRepo.findRolesByUserIds.mockResolvedValue([]);
      const result = await service.findAll(query);

      expect(userRepo.findAndCount).toHaveBeenCalledWith({
        where: [
          { name: expect.any(Object), isActive: true },
          { email: expect.any(Object), isActive: true },
        ],
        order: {
          email: 'ASC',
        },
        take: 5,
        skip: 5,
      });
      expect(result).toEqual({
        items: [mockUser],
        meta: {
          page: 2,
          limit: 5,
          total: 6,
          totalPages: 2,
        },
      });
    });
  });

  describe('UserService_Create', () => {
    it('should create a user successfully (Positive)', async () => {
      const payload = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      const result = await service.create(payload);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(payload.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(payload.password, 10);
      expect(userRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists (Negative)', async () => {
      const payload = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
      };

      userRepo.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.create(payload)).rejects.toThrow(ConflictException);
    });
  });

  describe('UserService_FindOne', () => {
    it('should return a user if found (Positive)', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      const result = await service.findOne(mockId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found (Negative)', async () => {
      userRepo.findOne.mockResolvedValue(null);
      let resultError: any;
      try {
        await service.findOne(mockId);
      } catch (e) {
        resultError = e;
      }
      expect(resultError).toBeInstanceOf(NotFoundException);
    });
  });

  describe('UserService_Update', () => {
    it('should update user successfully (Positive)', async () => {
      const updateDto = { email: 'new@example.com' };
      userRepo.findOne.mockResolvedValueOnce(mockUser as any); // Untuk findOne internal
      userRepo.findByEmail.mockResolvedValueOnce(null); // Cek email conflict
      userRepo.save.mockResolvedValue({ ...mockUser, ...updateDto } as any);

      const result = await service.update(mockId, updateDto);
      expect(result.email).toBe(updateDto.email);
    });

    it('should throw ConflictException if email already in use (Negative)', async () => {
      const updateDto = { email: 'existing@example.com' };
      userRepo.findOne.mockResolvedValueOnce(mockUser as any);
      userRepo.findByEmail.mockResolvedValueOnce({ id: 'other-id' } as any);

      let resultError: any;
      try {
        await service.update(mockId, updateDto);
      } catch (e) {
        resultError = e;
      }
      expect(resultError).toBeInstanceOf(ConflictException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('UserService_AssignRole', () => {
    it('should assign role to user successfully (Positive)', async () => {
      const payload = { roleIds: [randomUUID(), randomUUID()] };
      userRepo.findOne.mockResolvedValueOnce(mockUser as any);
      roleService.findById.mockResolvedValueOnce({
        id: payload.roleIds[0],
      } as any);
      roleService.findById.mockResolvedValueOnce({
        id: payload.roleIds[1],
      } as any);
      userRepo.assignRoles.mockResolvedValue({ success: true } as any);

      const result = await service.assignRole(mockId, payload);

      expect(roleService.findById).toHaveBeenCalledTimes(2);
      expect(roleService.findById).toHaveBeenNthCalledWith(
        1,
        payload.roleIds[0],
      );
      expect(roleService.findById).toHaveBeenNthCalledWith(
        2,
        payload.roleIds[1],
      );
      expect(userRepo.assignRoles).toHaveBeenCalledWith(
        mockId,
        payload.roleIds,
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if role not found (Negative)', async () => {
      const payload = { roleIds: [randomUUID()] };
      userRepo.findOne.mockResolvedValueOnce(mockUser as any);
      roleService.findById.mockRejectedValue(new NotFoundException());

      await expect(service.assignRole(mockId, payload)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepo.assignRoles).not.toHaveBeenCalled();
    });
  });

  describe('UserService_Remove', () => {
    it('should soft remove user (Positive)', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      userRepo.softRemove.mockResolvedValue(mockUser as any);

      await service.remove(mockId);
      expect(userRepo.softRemove).toHaveBeenCalledWith(mockUser);
    });
  });
});
