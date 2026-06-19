import { z } from 'zod';

const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((value) => value === true || value === 'true' || value === '1');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  CHAOS_ENABLED: booleanFromString.default(false),
  CHAOS_FAILURE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  CHAOS_MIN_LATENCY_MS: z.coerce.number().int().min(0).default(100),
  CHAOS_MAX_LATENCY_MS: z.coerce.number().int().min(0).default(800),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates `process.env` at boot. Throws a readable error and aborts startup
 * if anything required is missing or malformed.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
