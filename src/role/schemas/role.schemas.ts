import { z } from 'zod';

export const CreateRoleSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
});

export const AssignPermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      permissionId: z.uuid(),
      scopeId: z.uuid(),
    }),
  ),
});

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
export type AssignPermissionsDto = z.infer<typeof AssignPermissionsSchema>;

export interface RolePermissionSummary {
  permission_id: string;
  action: string;
  scope_id: string;
  scope: string;
  scope_priority: number | null;
}

export interface RoleSummary {
  role_id: string;
  role_name: string;
  role_description: string | null;
  permissions: RolePermissionSummary[];
}

export interface RolePermissionRow {
  role_id: string;
  role_name: string;
  role_description: string | null;
  permission_id: string | null;
  action: string | null;
  scope_id: string | null;
  scope: string | null;
  scope_priority: number | null;
}
