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
