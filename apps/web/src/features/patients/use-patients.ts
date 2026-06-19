'use client';

import type { ListQuery, PaginatedResponse, Patient, PatientInput } from '@pms/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

type ListResult = PaginatedResponse<Patient>;

function buildQueryString(query: Partial<ListQuery>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function usePatients(query: Partial<ListQuery>) {
  return useQuery<ListResult>({
    queryKey: queryKeys.patients.list(query),
    queryFn: () => apiFetch<ListResult>(`/patients?${buildQueryString(query)}`),
    // Keep showing the previous page while the next one loads — no layout flash.
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string | null) {
  return useQuery<Patient>({
    queryKey: queryKeys.patients.detail(id ?? ''),
    queryFn: () => apiFetch<Patient>(`/patients/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) =>
      apiFetch<Patient>('/patients', { method: 'POST', body: input }),
    onSuccess: (created) => {
      toast.success(`${created.firstName} ${created.lastName} added`);
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
  });
}

/** Snapshot of every cached patients query, used to roll back optimistic writes. */
type Snapshot = Array<[readonly unknown[], unknown]>;

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatientInput }) =>
      apiFetch<Patient>(`/patients/${id}`, { method: 'PUT', body: input }),

    // Optimistically patch the record everywhere it appears, then roll back on failure.
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.all });
      const previous: Snapshot = queryClient.getQueriesData({ queryKey: queryKeys.patients.all });

      queryClient.setQueriesData<ListResult>({ queryKey: ['patients', 'list'] }, (old) =>
        old
          ? { ...old, data: old.data.map((p) => (p.id === id ? { ...p, ...input } : p)) }
          : old,
      );
      queryClient.setQueryData<Patient>(queryKeys.patients.detail(id), (old) =>
        old ? { ...old, ...input } : old,
      );

      return { previous };
    },
    onError: (error, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(error.message || 'Update failed — changes reverted');
    },
    onSuccess: (updated) => toast.success(`${updated.firstName} ${updated.lastName} updated`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: true }>(`/patients/${id}`, { method: 'DELETE' }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.all });
      const previous: Snapshot = queryClient.getQueriesData({ queryKey: queryKeys.patients.all });

      queryClient.setQueriesData<ListResult>({ queryKey: ['patients', 'list'] }, (old) =>
        old
          ? {
              ...old,
              data: old.data.filter((p) => p.id !== id),
              total: Math.max(0, old.total - 1),
            }
          : old,
      );

      return { previous };
    },
    onError: (error, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(error.message || 'Delete failed — patient restored');
    },
    onSuccess: () => toast.success('Patient deleted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
  });
}
