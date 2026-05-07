import { z } from 'zod';

export const createCheckoutSchema = z.object({
  planCode: z.enum(['PRO', 'TEAM']),
  interval: z.enum(['MONTH', 'YEAR']),
});
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

// Robokassa ResultURL callback (server-to-server)
export const robokassaResultSchema = z.object({
  OutSum: z.string(),
  InvId: z.string(),
  SignatureValue: z.string(),
});
export type RobokassaResultInput = z.infer<typeof robokassaResultSchema>;

// Robokassa SuccessURL / FailURL (browser redirect)
export const robokassaRedirectSchema = z.object({
  OutSum: z.string(),
  InvId: z.string(),
  SignatureValue: z.string().optional(),
  Culture: z.string().optional(),
});
export type RobokassaRedirectInput = z.infer<typeof robokassaRedirectSchema>;
