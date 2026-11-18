import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .trim(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .trim(),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    joinMode: z.enum(['CODE', 'NEW_ORG']),
    teamCode: z.string().optional(),
    organizationName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.joinMode === 'NEW_ORG') {
        return !!data.organizationName && data.organizationName.trim().length >= 2;
      }
      return true;
    },
    {
      message: 'Organization name is required (min 2 characters)',
      path: ['organizationName'],
    }
  );

export type RegisterFormValues = z.infer<typeof registerSchema>;
