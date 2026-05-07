import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),

  AUTH_SECRET: z.string().min(16),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  RESEND_API_KEY: z.string().default('re_stub'),
  EMAIL_FROM: z.string().default('Sepaito <noreply@sepaito.ai>'),

  ROBOKASSA_MERCHANT_LOGIN: z.string().default('demo'),
  ROBOKASSA_PASSWORD_1: z.string().default('password1'),
  ROBOKASSA_PASSWORD_2: z.string().default('password2'),
  ROBOKASSA_TEST_MODE: z
    .union([z.literal('0'), z.literal('1'), z.boolean()])
    .default('1')
    .transform((v) => !!(v === '1' || v === true)),

  PUBLIC_WEB_URL: z.string().url().default('http://localhost:3000'),
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  GRPC_BIND: z.string().default('0.0.0.0:50051'),

  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;
