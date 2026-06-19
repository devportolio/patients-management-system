'use client';

import type { AuthUser, LoginInput, LoginResponse } from '@pms/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

/** Current authenticated user, or null when the session is invalid/expired. */
export function useSession() {
  return useQuery<AuthUser | null>({
    queryKey: queryKeys.session,
    queryFn: async () => {
      try {
        return await apiFetch<AuthUser>('/auth/me');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: input }),
    // Seed the session cache; the call site handles navigation (it knows the
    // post-login redirect target from the URL).
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.session, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.clear();
      router.replace('/login');
    },
  });
}
