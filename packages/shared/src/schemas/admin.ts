import { z } from 'zod';

export const adminListUsersQuerySchema = z.object({
  q: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;

export const adminUpdateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  name: z.string().trim().max(80).optional(),
  emailVerified: z.boolean().optional(),
});
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const adminGrantSubscriptionSchema = z.object({
  userId: z.string().min(1),
  planCode: z.enum(['HOBBY', 'PRO', 'TEAM']),
  interval: z.enum(['MONTH', 'YEAR']),
  periodEnd: z.string().datetime().optional(),
});
export type AdminGrantSubscriptionInput = z.infer<typeof adminGrantSubscriptionSchema>;
