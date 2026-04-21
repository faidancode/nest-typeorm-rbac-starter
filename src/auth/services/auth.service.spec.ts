import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../user/repositories/user.repository';
import { User } from 'src/user/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Pick<UserRepository, 'findOne'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

  const mockedCompare = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;
  const mockedHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

  const mockUser: User = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: 'hashed-password',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null as any,
  };

  beforeEach(async () => {
    // Mocking Dependencies
    userRepo = {
      findOne: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    mockedCompare.mockReset();
    mockedHash.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Email atau password salah'),
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      mockedCompare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Email atau password salah'),
      );
    });

    it('should return tokens and user data on successful login', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      jwtService.signAsync
        .mockResolvedValueOnce('access_token_abc') // Untuk Access Token
        .mockResolvedValueOnce('refresh_token_xyz'); // Untuk Refresh Token

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'access_token_abc',
        refreshToken: 'refresh_token_xyz',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });
  });

  describe('refreshAccessToken', () => {
    const rawRefreshToken = 'valid_refresh_token';
    const payload = { sub: 'user-123' };
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };

    it('should throw UnauthorizedException if token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshAccessToken(rawRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should throw UnauthorizedException if user in payload not found', async () => {
      jwtService.verifyAsync.mockResolvedValue(payload);
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshAccessToken(rawRefreshToken)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should return new tokens and user data successfully', async () => {
      jwtService.verifyAsync.mockResolvedValue(payload);
      userRepo.findOne.mockResolvedValue(mockUser as any);

      jwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      const result = await service.refreshAccessToken(rawRefreshToken);

      expect(result).toHaveProperty('accessToken', 'new_access_token');
      expect(result).toHaveProperty('refreshToken', 'new_refresh_token');
      expect(result.user.id).toBe(mockUser.id);
    });
  });
});
