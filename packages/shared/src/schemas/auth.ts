import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(10, 'At least 10 characters')
  .regex(/[a-zA-Z]/, 'Must contain a letter')
  .regex(/[0-9]/, 'Must contain a number');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80).optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & Privacy.' }),
  }),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const performPasswordResetSchema = z.object({
  token: z.string().min(16),
  password: passwordSchema,
});
export type PerformPasswordResetInput = z.infer<typeof performPasswordResetSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(16),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(['EN', 'RU']).optional(),
  defaultThemeId: z.string().nullable().optional(),
  defaultModelId: z.string().nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
