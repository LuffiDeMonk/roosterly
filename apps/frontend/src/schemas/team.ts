import { z } from 'zod';

export const joinTeamSchema = z.object({
  code: z
    .string()
    .min(6, 'Ward code must be exactly 6 characters')
    .max(6, 'Ward code must be exactly 6 characters')
    .toUpperCase()
    .trim(),
});

export type JoinTeamFormValues = z.infer<typeof joinTeamSchema>;

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, 'Ward name must be at least 2 characters')
    .trim(),
  department: z.string().optional(),
});

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>;
