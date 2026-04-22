import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  userId: z.uuid().nullable().optional(),
  departmentId: z.uuid().nullable().optional(),
  managerId: z.uuid().nullable().optional(),
  fullName: z.string().min(1),
  nip: z.string().min(1),
  gender: z.enum(['Laki-Laki', 'Perempuan']),
  positionId: z.uuid(),
  dateOfJoining: z.coerce.date(),
  dateOfActivePosition: z.coerce.date(),
  employeeStatus: z.enum(['Permanen', 'Kontrak']),
  isActive: z.boolean().optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export const ListEmployeeSchema = z.object({
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  sort: z.string().default('createdAt:desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
});

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;
export type ListEmployeeDto = z.infer<typeof ListEmployeeSchema>;
