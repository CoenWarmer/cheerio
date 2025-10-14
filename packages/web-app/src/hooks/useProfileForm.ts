import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { profilesApi } from '@/lib/api-client';
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

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<UserPermission>('supporter');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/sign-in');
          return;
        }

        setUser(user);

        // Fetch profile
        const profileResult = await profilesApi.getCurrent();
        const profile = profileResult.data;

        setDisplayName(profile.display_name || '');
        setAvatarUrl(profile.avatar_url);
        setPermissions(profile.permissions || 'supporter');

        // Extract path from URL if it exists
        if (profile.avatar_url) {
          const url = new URL(profile.avatar_url);
          const pathMatch = url.pathname.match(/avatars\/(.+)/);
          if (pathMatch) {
            setAvatarPath(`avatars/${pathMatch[1]}`);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

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
    setUploading(true);
    setError(null);

    try {
      const result = await profilesApi.uploadAvatar(file);
      setAvatarUrl(result.avatar_url);
      setAvatarPath(result.path);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarPath) return;

    if (!confirm('Are you sure you want to remove your avatar?')) return;

    try {
      await profilesApi.deleteAvatar(avatarPath);
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
    setSaving(true);
    setError(null);

    try {
      await profilesApi.update({
        display_name: displayName || undefined,
        avatar_url: avatarUrl ?? undefined,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return {
    user,
    displayName,
    setDisplayName,
    avatarUrl,
    avatarPath,
    permissions,
    loading,
    saving,
    uploading,
    error,
    success,
    previewUrl,
    handleFileSelect,
    handleRemoveAvatar,
    handleSubmit,
  };
}
