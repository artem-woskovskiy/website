import { z } from 'zod';

export const adminListUsersQuerySchema = z.object({
  q: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  plan: z.string().optional(),
  sort: z.enum(['createdAt_desc', 'createdAt_asc', 'email_asc']).default('createdAt_desc'),
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

export const adminBulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
});
export type AdminBulkIdsInput = z.infer<typeof adminBulkIdsSchema>;

export const adminBulkRoleSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  role: z.enum(['USER', 'ADMIN']),
});
export type AdminBulkRoleInput = z.infer<typeof adminBulkRoleSchema>;

export const adminUpdatePlanSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  priceMonthlyRub: z.coerce.number().int().min(0).optional(),
  priceYearlyRub: z.coerce.number().int().min(0).optional(),
  panesLimit: z.coerce.number().int().min(0).optional(),
  workspacesLimit: z.coerce.number().int().min(0).optional(),
  features: z.array(z.string().trim().min(1).max(160)).max(50).optional(),
  isActive: z.boolean().optional(),
});
export type AdminUpdatePlanInput = z.infer<typeof adminUpdatePlanSchema>;

export const adminUpdateConfigSchema = z.object({
  value: z.string().max(2000),
  description: z.string().trim().max(500).nullable().optional(),
});
export type AdminUpdateConfigInput = z.infer<typeof adminUpdateConfigSchema>;

export const adminRefundPaymentSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});
export type AdminRefundPaymentInput = z.infer<typeof adminRefundPaymentSchema>;
