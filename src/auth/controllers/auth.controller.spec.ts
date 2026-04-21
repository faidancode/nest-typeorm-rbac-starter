import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthService } from '../services/auth.service';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory';

describe('AuthControllerTest', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;
  let caslFactory: jest.Mocked<Pick<CaslAbilityFactory, 'createForUser'>>;

  const mockUserResponse = {
    id: randomUUID(),
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
  };

  const mockAuthResult = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: mockUserResponse,
  };

  const mockAbility = {
    rules: [{ action: 'read', subject: 'user' }],
  };

  beforeEach(async () => {
    // Mocking Service sesuai pola Partial Record
    const serviceMock: Partial<Record<keyof AuthService, any>> = {
      login: jest.fn(),
      refreshAccessToken: jest.fn(),
    };

    const caslFactoryMock: Partial<Record<keyof CaslAbilityFactory, any>> = {
      createForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: serviceMock,
        },
        {
          provide: CaslAbilityFactory,
          useValue: caslFactoryMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService) as jest.Mocked<AuthService>;
    caslFactory = module.get(CaslAbilityFactory) as jest.Mocked<
      Pick<CaslAbilityFactory, 'createForUser'>
    >;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('AuthController_Login', () => {
    const loginDto = { email: 'john@example.com', password: 'password123' };

    it('should return auth tokens and user data on successful login (Positive)', async () => {
      service.login.mockResolvedValue(mockAuthResult as any);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResult);
    });

    it('should throw UnauthorizedException if login fails (Negative)', async () => {
      service.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('AuthController_Refresh', () => {
    it('should return new tokens when given a valid refresh token (Positive)', async () => {
      const refreshToken = 'valid-refresh-token';
      service.refreshAccessToken.mockResolvedValue(mockAuthResult as any);

      const result = await controller.refresh(refreshToken);

      expect(service.refreshAccessToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockAuthResult);
    });

    it('should throw UnauthorizedException for invalid refresh token (Negative)', async () => {
      service.refreshAccessToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('AuthController_Me', () => {
    it('should return user data from request object (Positive)', async () => {
      // Simulasi objek request yang diisi oleh JwtStrategy
      const mockRequest = {
        user: {
          id: mockUserResponse.id,
          email: mockUserResponse.email,
          positionId: randomUUID(),
          departmentId: randomUUID(),
        },
      };

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockRequest.user);
    });
  });

  describe('AuthController_MePermissions', () => {
    it('should return CASL rules for current user (Positive)', async () => {
      caslFactory.createForUser.mockResolvedValue(mockAbility as any);

      const result = await controller.getMyPermissions({
        user: { id: mockUserResponse.id },
      });

      expect(caslFactory.createForUser).toHaveBeenCalledWith({
        id: mockUserResponse.id,
      });
      expect(result).toEqual(mockAbility.rules);
    });
  });
});
