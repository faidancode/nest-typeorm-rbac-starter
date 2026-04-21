import { z } from 'zod';

export const CreatePositionSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().uuid(),
});

export const UpdatePositionSchema = z.object({
  name: z.string().min(1).optional(),
  departmentId: z.string().uuid().optional(),
});

export type CreatePositionDto = z.infer<typeof CreatePositionSchema>;
export type UpdatePositionDto = z.infer<typeof UpdatePositionSchema>;
