'use client';

import {
  useProfilesQuery,
  useCurrentProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} from './queries/useProfilesQueries';

export function useProfiles(userIds: string[]) {
  const { data, isLoading, error } = useProfilesQuery(userIds);

  return {
    profiles: data?.data ?? [],
    isLoading,
    error,
  };
}

export function useCurrentProfile() {
  const { data, isLoading, error, refetch } = useCurrentProfileQuery();

  return {
    profile: data?.data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useUpdateProfile() {
  const mutation = useUpdateProfileMutation();

  return {
    updateProfile: mutation.mutate,
    updateProfileAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUploadAvatar() {
  const mutation = useUploadAvatarMutation();

  return {
    uploadAvatar: mutation.mutate,
    uploadAvatarAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteAvatar() {
  const mutation = useDeleteAvatarMutation();

  return {
    deleteAvatar: mutation.mutate,
    deleteAvatarAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
