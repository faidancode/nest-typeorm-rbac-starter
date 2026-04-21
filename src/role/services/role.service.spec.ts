import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from '../schemas/role.schemas';

describe('RoleServiceTest', () => {
  let service: RoleService;
  let roleRepo: jest.Mocked<
    Pick<RoleRepository, 'create' | 'findAllWithPermissions' | 'findByIdWithPermissions' | 'update' | 'delete' | 'assignPermissions'>
  >;
  let permissionRepo: jest.Mocked<Pick<PermissionRepository, 'checkPermissionScope'>>;

  beforeEach(async () => {
    // Mocking Repository sesuai pola yang dilampirkan
    roleRepo = {
      create: jest.fn(),
      findAllWithPermissions: jest.fn(),
      findByIdWithPermissions: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      assignPermissions: jest.fn(),
    };

    permissionRepo = {
      checkPermissionScope: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: RoleRepository,
          useValue: roleRepo,
        },
        {
          provide: PermissionRepository,
          useValue: permissionRepo,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('RoleService_Create', () => {
    it('should create a new role successfully', async () => {
      const payload: CreateRoleDto = { name: 'Admin' };
      roleRepo.create.mockResolvedValue({ id: 'role-1', ...payload } as any);

      const result = await service.create(payload);

      expect(roleRepo.create).toHaveBeenCalledWith(payload);
      expect(result).toHaveProperty('id', 'role-1');
    });
  });

  describe('RoleService_FindAll', () => {
    it('should return all roles with permissions', async () => {
      const mockRoles = [{ id: '1', name: 'Admin', permissions: [] }];
      roleRepo.findAllWithPermissions.mockResolvedValue(mockRoles as any);

      const result = await service.findAll();

      expect(roleRepo.findAllWithPermissions).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
    });
  });

  describe('RoleService_FindById', () => {
    it('should return a role if found', async () => {
      const mockRole = { id: 'role-1', name: 'Admin' };
      roleRepo.findByIdWithPermissions.mockResolvedValue(mockRole as any);

      const result = await service.findById('role-1');

      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepo.findByIdWithPermissions.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('RoleService_AssignPermissions', () => {
    const roleId = 'role-1';
    const payload: AssignPermissionsDto = {
      permissions: [{ permissionId: 'perm-1', scopeId: 'scope-1' }],
    };

    it('should assign permissions if all validations pass', async () => {
      // Mock findById (internal call)
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: roleId } as any);
      // Mock validation check
      permissionRepo.checkPermissionScope.mockResolvedValue(true);
      // Mock final assignment
      roleRepo.assignPermissions.mockResolvedValue({ success: true } as any);

      await service.assignPermissions(roleId, payload);

      expect(permissionRepo.checkPermissionScope).toHaveBeenCalledWith('perm-1', 'scope-1');
      expect(roleRepo.assignPermissions).toHaveBeenCalledWith(roleId, payload.permissions);
    });

    describe('Negative Scenarios', () => {
      it('should throw NotFoundException if role does not exist', async () => {
        roleRepo.findByIdWithPermissions.mockResolvedValue(null);

        await expect(service.assignPermissions(roleId, payload)).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if permission/scope is invalid', async () => {
        roleRepo.findByIdWithPermissions.mockResolvedValue({ id: roleId } as any);
        // Simulate permission not found
        permissionRepo.checkPermissionScope.mockResolvedValue(false);

        await expect(service.assignPermissions(roleId, payload)).rejects.toThrow(
          new NotFoundException(`Invalid permissionId or scopeId: perm-1/scope-1`),
        );
      });
    });
  });

  describe('RoleService_Remove', () => {
    it('should delete role if it exists', async () => {
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: '1' } as any);
      roleRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('1');

      expect(roleRepo.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error if repository fails during deletion', async () => {
      roleRepo.findByIdWithPermissions.mockResolvedValue({ id: '1' } as any);
      roleRepo.delete.mockRejectedValue(new Error('DB failure'));

      await expect(service.remove('1')).rejects.toThrow('DB failure');
    });
  });
});