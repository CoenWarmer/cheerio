import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import {
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
} from '@/hooks/useProfiles';
import type { User } from '@supabase/supabase-js';
import type { UserPermission } from '@/types/permissions';

interface UseProfileFormResult {
  user: User | null;
  displayName: string;
  setDisplayName: (name: string) => void;
  avatarUrl: string | null;
  avatarPath: string | null;
  permissions: UserPermission;
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  deleting: boolean;
  error: string | null;
  success: boolean;
  previewUrl: string | null;
  handleFileSelect: (file: File) => Promise<void>;
  handleRemoveAvatar: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}

/**
 * Hook to manage profile editing form state and operations
 */
export function useProfileForm(): UseProfileFormResult {
  const router = useRouter();

  // Use existing hooks
  const { user, profile, loading: profileLoading } = useProfile();
  const { updateProfileAsync, isUpdating } = useUpdateProfile();
  const { uploadAvatarAsync, isUploading } = useUploadAvatar();
  const { deleteAvatarAsync, isDeleting } = useDeleteAvatar();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<UserPermission>('supporter');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!profileLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, profileLoading, router]);

  // Sync profile data to local state
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url);
      setPermissions(profile.permissions || 'supporter');

      // Extract path from URL if it exists
      if (profile.avatar_url) {
        try {
          const url = new URL(profile.avatar_url);
          const pathMatch = url.pathname.match(/avatars\/(.+)/);
          if (pathMatch) {
            setAvatarPath(`avatars/${pathMatch[1]}`);
          }
        } catch (err) {
          console.error('Error parsing avatar URL:', err);
        }
      }
    }
  }, [profile]);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setError(null);

    try {
      const result = await uploadAvatarAsync(file);
      setAvatarUrl(result.avatar_url);
      setAvatarPath(result.path);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      setPreviewUrl(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarPath) return;

    if (!confirm('Are you sure you want to remove your avatar?')) return;

    try {
      await deleteAvatarAsync(avatarPath);
      setAvatarUrl(null);
      setAvatarPath(null);
      setPreviewUrl(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error removing avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove avatar');
    }
  };

  const handleSubmit = async () => {
    setError(null);

    try {
      await updateProfileAsync({
        display_name: displayName || undefined,
        avatar_url: avatarUrl ?? undefined,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  return {
    user,
    displayName,
    setDisplayName,
    avatarUrl,
    avatarPath,
    permissions,
    loading: profileLoading,
    saving: isUpdating,
    uploading: isUploading,
    deleting: isDeleting,
    error,
    success,
    previewUrl,
    handleFileSelect,
    handleRemoveAvatar,
    handleSubmit,
  };
}
