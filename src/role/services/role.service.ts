import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';
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
  ) {}

  async create(payload: CreateRoleDto) {
    return this.roleRepo.create(payload);
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
    await this.findById(id);

    return this.roleRepo.update(id, payload);
  }

  async remove(id: string) {
    await this.findById(id);

    return this.roleRepo.delete(id);
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

    return this.roleRepo.assignPermissions(roleId, payload.permissions);
  }
}
