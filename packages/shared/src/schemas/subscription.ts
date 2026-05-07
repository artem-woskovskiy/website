import { z } from 'zod';

export const subscriptionStatusSchema = z.enum([
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
]);

export const subscriptionDtoSchema = z.object({
  id: z.string(),
  planCode: z.enum(['HOBBY', 'PRO', 'TEAM']),
  status: subscriptionStatusSchema,
  interval: z.enum(['MONTH', 'YEAR']),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});
export type SubscriptionDto = z.infer<typeof subscriptionDtoSchema>;

export const ideTokenSchema = z.object({
  installId: z.string().min(8).max(128),
  platform: z.enum(['darwin', 'win32', 'linux']),
  deviceName: z.string().max(80).optional(),
});
export type IdeTokenInput = z.infer<typeof ideTokenSchema>;
