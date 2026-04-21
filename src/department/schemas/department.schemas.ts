import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1),
});

export const UpdateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
});

export type CreateDepartmentDto = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof UpdateDepartmentSchema>;
