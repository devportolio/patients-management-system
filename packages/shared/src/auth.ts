import { z } from 'zod';
import { roleSchema } from './common';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Public representation of an authenticated user (never includes the password hash). */
export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: roleSchema,
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** JWT payload signed by the API. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: z.infer<typeof roleSchema>;
}
