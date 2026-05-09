import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { AuditService } from 'src/common/logging/audit.service';
import {
  AssignPermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '../schemas/role.schemas';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly permissionRepo: PermissionRepository,
    private readonly audit: AuditService,
  ) {}

  async create(payload: CreateRoleDto) {
    const created = await this.roleRepo.create(payload);

    this.audit.record({
      action: 'create',
      resource: 'role',
      resourceId: created.id,
      after: created,
    });

    return created;
  }

  async findAll() {
    return this.roleRepo.findAllWithPermissions();
  }

  async findById(id: string) {
    const role = await this.roleRepo.findByIdWithPermissions(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, payload: UpdateRoleDto) {
    const before = await this.findById(id);
    const updated = await this.roleRepo.update(id, payload);

    this.audit.record({
      action: 'update',
      resource: 'role',
      resourceId: id,
      before,
      after: updated,
    });

    return updated;
  }

  async remove(id: string) {
    const before = await this.findById(id);
    const deleted = await this.roleRepo.delete(id);

    this.audit.record({
      action: 'delete',
      resource: 'role',
      resourceId: id,
      before,
      after: deleted,
    });

    return deleted;
  }

  async assignPermissions(roleId: string, payload: AssignPermissionsDto) {
    await this.findById(roleId);

    // validate permission + scope exists
    for (const item of payload.permissions) {
      const exists = await this.permissionRepo.checkPermissionScope(
        item.permissionId,
        item.scopeId,
      );

      if (!exists) {
        throw new NotFoundException(
          `Invalid permissionId or scopeId: ${item.permissionId}/${item.scopeId}`,
        );
      }
    }

    const assigned = await this.roleRepo.assignPermissions(
      roleId,
      payload.permissions,
    );

    this.audit.record({
      action: 'assign_permissions',
      resource: 'role',
      resourceId: roleId,
      after: {
        permissions: payload.permissions,
      },
    });

    return assigned;
  }
}
