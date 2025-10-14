'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/lib/api-client';

export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (ids: string[]) =>
    [...profileKeys.lists(), ids.sort().join(',')] as const,
  current: () => [...profileKeys.all, 'current'] as const,
};

export function useProfilesQuery(userIds: string[]) {
  return useQuery({
    queryKey: profileKeys.list(userIds),
    queryFn: () => profilesApi.getByIds(userIds),
    enabled: userIds.length > 0,
  });
}

export function useCurrentProfileQuery() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: () => profilesApi.getCurrent(),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profilesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profilesApi.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
    },
  });
}

export function useDeleteAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profilesApi.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
    },
  });
}
