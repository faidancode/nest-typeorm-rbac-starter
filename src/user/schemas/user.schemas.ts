import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  isActive: z.boolean().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  passwordHash: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const AssignUserRoleSchema = z.object({
  roleIds: z.array(z.uuid()).min(1),
});

export const ListUserSchema = z.object({
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  sort: z.string().default('createdAt:desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type AssignUserRoleDto = z.infer<typeof AssignUserRoleSchema>;
export type ListUserDto = z.infer<typeof ListUserSchema>;

export interface UserRoleSummary {
  id: string;
  name: string;
}
