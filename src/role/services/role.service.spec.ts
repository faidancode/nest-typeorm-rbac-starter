import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from '../schemas/role.schemas';

describe('RoleServiceTest', () => {
  let service: RoleService;
  let roleRepo: jest.Mocked<
    Pick<
      RoleRepository,
      | 'create'
      | 'findAllWithPermissions'
      | 'findAllForSelect'
      | 'findByIdWithPermissions'
      | 'update'
      | 'delete'
      | 'assignPermissions'
    >
  >;
  let permissionRepo: jest.Mocked<
    Pick<PermissionRepository, 'checkPermissionScope'>
  >;

  beforeEach(async () => {
    // Mocking Repository sesuai pola yang dilampirkan
    roleRepo = {
      create: jest.fn(),
      findAllWithPermissions: jest.fn(),
      findAllForSelect: jest.fn(),
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
      const mockRows = [
        {
          role_id: 'role-1',
          role_name: 'Admin',
          role_description: 'Full access',
          permission_id: 'perm-1',
          action: 'employee.read',
          scope_id: 'scope-1',
          scope: 'all',
          scope_priority: 4,
        },
        {
          role_id: 'role-1',
          role_name: 'Admin',
          role_description: 'Full access',
          permission_id: 'perm-2',
          action: 'employee.update',
          scope_id: 'scope-2',
          scope: 'department',
          scope_priority: 3,
        },
      ];
      roleRepo.findAllWithPermissions.mockResolvedValue(mockRows as any);

      const result = await service.findAll();

      expect(roleRepo.findAllWithPermissions).toHaveBeenCalled();
      expect(result).toEqual([
        {
          role_id: 'role-1',
          role_name: 'Admin',
          role_description: 'Full access',
          permissions: [
            {
              permission_id: 'perm-2',
              action: 'employee.update',
              scope_id: 'scope-2',
              scope: 'department',
              scope_priority: 3,
            },
            {
              permission_id: 'perm-1',
              action: 'employee.read',
              scope_id: 'scope-1',
              scope: 'all',
              scope_priority: 4,
            },
          ],
        },
      ]);
    });
  });

  describe('RoleService_FindAllForSelect', () => {
    it('should return roles for select inputs', async () => {
      const mockRoles = [
        {
          role_id: 'role-1',
          role_name: 'admin',
          role_description: 'Full access',
        },
      ];
      roleRepo.findAllForSelect.mockResolvedValue(mockRoles as any);

      const result = await service.findAllForSelect();

      expect(roleRepo.findAllForSelect).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
    });
  });

  describe('RoleService_FindById', () => {
    it('should return a role if found', async () => {
      const mockRows = [
        {
          role_id: 'role-1',
          role_name: 'Admin',
          role_description: 'Full access',
          permission_id: 'perm-1',
          action: 'employee.read',
          scope_id: 'scope-1',
          scope: 'all',
          scope_priority: 4,
        },
      ];
      roleRepo.findByIdWithPermissions.mockResolvedValue(mockRows as any);

      const result = await service.findById('role-1');

      expect(result).toEqual({
        role_id: 'role-1',
        role_name: 'Admin',
        role_description: 'Full access',
        permissions: [
          {
            permission_id: 'perm-1',
            action: 'employee.read',
            scope_id: 'scope-1',
            scope: 'all',
            scope_priority: 4,
          },
        ],
      });
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepo.findByIdWithPermissions.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('RoleService_AssignPermissions', () => {
    const roleId = 'role-1';
    const payload: AssignPermissionsDto = {
      permissions: [{ permissionId: 'perm-1', scopeId: 'scope-1' }],
    };

    it('should assign permissions if all validations pass', async () => {
      // Mock findById (internal call)
      roleRepo.findByIdWithPermissions.mockResolvedValue([
        {
          role_id: roleId,
          role_name: 'Admin',
          role_description: null,
          permission_id: null,
          action: null,
          scope_id: null,
          scope: null,
          scope_priority: null,
        },
      ] as any);
      // Mock validation check
      permissionRepo.checkPermissionScope.mockResolvedValue(true);
      // Mock final assignment
      roleRepo.assignPermissions.mockResolvedValue({ success: true } as any);

      await service.assignPermissions(roleId, payload);

      expect(permissionRepo.checkPermissionScope).toHaveBeenCalledWith(
        'perm-1',
        'scope-1',
      );
      expect(roleRepo.assignPermissions).toHaveBeenCalledWith(
        roleId,
        payload.permissions,
      );
    });

    describe('Negative Scenarios', () => {
      it('should throw NotFoundException if role does not exist', async () => {
        roleRepo.findByIdWithPermissions.mockResolvedValue(null);

        await expect(
          service.assignPermissions(roleId, payload),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if permission/scope is invalid', async () => {
        roleRepo.findByIdWithPermissions.mockResolvedValue([
          {
            role_id: roleId,
            role_name: 'Admin',
            role_description: null,
            permission_id: null,
            action: null,
            scope_id: null,
            scope: null,
            scope_priority: null,
          },
        ] as any);
        // Simulate permission not found
        permissionRepo.checkPermissionScope.mockResolvedValue(false);

        await expect(
          service.assignPermissions(roleId, payload),
        ).rejects.toThrow(
          new NotFoundException(
            `Invalid permissionId or scopeId: perm-1/scope-1`,
          ),
        );
      });
    });
  });

  describe('RoleService_Remove', () => {
    it('should delete role if it exists', async () => {
      roleRepo.findByIdWithPermissions.mockResolvedValue([
        {
          role_id: '1',
          role_name: 'Admin',
          role_description: null,
          permission_id: null,
          action: null,
          scope_id: null,
          scope: null,
          scope_priority: null,
        },
      ] as any);
      roleRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('1');

      expect(roleRepo.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error if repository fails during deletion', async () => {
      roleRepo.findByIdWithPermissions.mockResolvedValue([
        {
          role_id: '1',
          role_name: 'Admin',
          role_description: null,
          permission_id: null,
          action: null,
          scope_id: null,
          scope: null,
          scope_priority: null,
        },
      ] as any);
      roleRepo.delete.mockRejectedValue(new Error('DB failure'));

      await expect(service.remove('1')).rejects.toThrow('DB failure');
    });
  });
});
