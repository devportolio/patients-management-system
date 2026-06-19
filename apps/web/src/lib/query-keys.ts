import type { ListQuery } from '@pms/shared';

/** Centralized React Query keys so caches invalidate consistently. */
export const queryKeys = {
  session: ['session'] as const,
  patients: {
    all: ['patients'] as const,
    list: (query: Partial<ListQuery>) => ['patients', 'list', query] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
  },
};
