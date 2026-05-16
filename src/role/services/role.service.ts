import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import {
  AssignPermissionsDto,
  CreateRoleDto,
  RolePermissionRow,
  RoleSummary,
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
    const rows = await this.roleRepo.findAllWithPermissions();
    return this.groupRoles(rows);
  }

  async findAllForSelect() {
    return this.roleRepo.findAllForSelect();
  }

  async findById(id: string) {
    const rows = await this.roleRepo.findByIdWithPermissions(id);

    if (!rows) {
      throw new NotFoundException('Role not found');
    }

    const [role] = this.groupRoles(rows);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, payload: UpdateRoleDto) {
    await this.findById(id);

    await this.roleRepo.update(id, payload);

    return this.findById(id);
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

  private groupRoles(rows: RolePermissionRow[]): RoleSummary[] {
    const roles = new Map<string, RoleSummary>();

    for (const row of rows) {
      if (!roles.has(row.role_id)) {
        roles.set(row.role_id, {
          role_id: row.role_id,
          role_name: row.role_name,
          role_description: row.role_description,
          permissions: [],
        });
      }

      if (row.permission_id && row.action && row.scope_id && row.scope) {
        roles.get(row.role_id)?.permissions.push({
          permission_id: row.permission_id,
          action: row.action,
          scope_id: row.scope_id,
          scope: row.scope,
          scope_priority: row.scope_priority,
        });
      }
    }

    return [...roles.values()].map((role) => ({
      ...role,
      permissions: role.permissions.sort((a, b) => {
        const scopePriorityA = a.scope_priority ?? Number.MAX_SAFE_INTEGER;
        const scopePriorityB = b.scope_priority ?? Number.MAX_SAFE_INTEGER;

        if (scopePriorityA !== scopePriorityB) {
          return scopePriorityA - scopePriorityB;
        }

        return a.action.localeCompare(b.action);
      }),
    }));
  }
}
