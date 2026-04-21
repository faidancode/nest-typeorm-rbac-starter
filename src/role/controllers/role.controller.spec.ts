import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from '../services/role.service';
import { PoliciesGuard } from '../../common/casl/policies.guard';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CaslAbilityFactory } from '../../common/casl/casl-ability.factory';
import { randomUUID } from 'crypto';

describe('RoleControllerTest', () => {
  let controller: RoleController;
  let service: jest.Mocked<RoleService>;

  beforeEach(async () => {
    // Mocking Service sesuai pola Partial Record yang dilampirkan
    const serviceMock: Partial<Record<keyof RoleService, any>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      assignPermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
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

    controller = module.get<RoleController>(RoleController);
    service = module.get(RoleService) as jest.Mocked<RoleService>;
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('RoleController_Create', () => {
    it('should call service.create with parsed payload', async () => {
      const body = { name: 'Admin' };
      const expectedResponse = { id: 'role-1', ...body };
      service.create.mockResolvedValue(expectedResponse as any);

      const result = await controller.create(body);

      expect(service.create).toHaveBeenCalledWith(body);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('RoleController_FindAll', () => {
    it('should return all roles', async () => {
      const roles = [{ id: '1', name: 'Admin' }];
      service.findAll.mockResolvedValue(roles as any);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(roles);
    });

    describe('Negative Scenarios', () => {
      it('should throw error when service fails', async () => {
        service.findAll.mockRejectedValue(new Error('Internal Server Error'));

        await expect(controller.findAll()).rejects.toThrow(
          'Internal Server Error',
        );
      });
    });
  });

  describe('RoleController_FindOne', () => {
    it('should return a single role by id', async () => {
      const role = { id: 'role-1', name: 'Manager' };
      service.findById.mockResolvedValue(role as any);

      const result = await controller.findOne('role-1');

      expect(service.findById).toHaveBeenCalledWith('role-1');
      expect(result).toEqual(role);
    });
  });

  describe('RoleController_Update', () => {
    it('should call service.update with correct params', async () => {
      const id = 'role-1';
      const body = { name: 'Updated Name' };
      service.update.mockResolvedValue({ id, ...body } as any);

      const result = await controller.update(id, body);

      expect(service.update).toHaveBeenCalledWith(id, body);
      expect(result).toHaveProperty('name', 'Updated Name');
    });
  });

  describe('RoleController_AssignPermissions', () => {
    it('should call service.assignPermissions with parsed payload', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const body = {
        permissions: [{ permissionId: randomUUID(), scopeId: randomUUID() }],
      };
      service.assignPermissions.mockResolvedValue({ success: true } as any);

      const result = await controller.assignPermissions(id, body);

      expect(service.assignPermissions).toHaveBeenCalledWith(id, body);
      expect(result).toEqual({ success: true });
    });
  });

  describe('RoleController_Remove', () => {
    it('should call service.remove', async () => {
      const id = 'role-1';
      service.remove.mockResolvedValue({ deleted: true } as any);

      await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
