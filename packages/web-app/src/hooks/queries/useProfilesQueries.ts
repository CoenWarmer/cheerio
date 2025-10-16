'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/lib/api/profiles-api';
import { useCurrentUser } from '../useCurrentUser';

export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (ids: string[]) =>
    [...profileKeys.lists(), ids.sort().join(',')] as const,
  current: (userId?: string) =>
    [...profileKeys.all, 'current', userId] as const,
};

export function useProfilesQuery(userIds: string[]) {
  return useQuery({
    queryKey: profileKeys.list(userIds),
    queryFn: () => profilesApi.getByIds(userIds),
    enabled: userIds.length > 0,
  });
}

export function useCurrentProfileQuery() {
  const { currentUser } = useCurrentUser();
  const userId = currentUser?.id;

  return useQuery({
    queryKey: profileKeys.current(userId),
    queryFn: () => profilesApi.getCurrent(userId),
    enabled: !!userId,
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
