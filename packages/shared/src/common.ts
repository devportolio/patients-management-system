import { z } from 'zod';

/** User roles understood across the whole system. */
export const roleSchema = z.enum(['admin', 'user']);
export type Role = z.infer<typeof roleSchema>;

/** Fields a patient list can be sorted by. */
export const patientSortableFields = [
  'firstName',
  'lastName',
  'email',
  'dob',
  'createdAt',
] as const;

export const sortOrderSchema = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof sortOrderSchema>;

/**
 * Query parameters for the paginated patients list.
 * Uses `coerce` because query strings arrive as strings.
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(patientSortableFields).default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

/** Generic shape of a paginated response. */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

/** Standard error envelope returned by the API on failures. */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}
