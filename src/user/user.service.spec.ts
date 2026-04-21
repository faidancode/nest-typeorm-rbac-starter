import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UserServiceTest', () => {
  let service: UserService;
  let userRepo: jest.Mocked<
    Pick<
      UserRepository,
      'create' | 'find' | 'findOne' | 'save' | 'softRemove' | 'findByEmail'
    >
  >;

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
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: userRepo,
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
    it('should return an array of users (Positive)', async () => {
      userRepo.find.mockResolvedValue([mockUser] as any);
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
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

  describe('UserService_Remove', () => {
    it('should soft remove user (Positive)', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      userRepo.softRemove.mockResolvedValue(mockUser as any);

      await service.remove(mockId);
      expect(userRepo.softRemove).toHaveBeenCalledWith(mockUser);
    });
  });
});
