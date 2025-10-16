import { UserPermission } from '@/types/permissions';
import { ApiError, fetchApi } from './api-client';

/**
 * Profiles API
 */
export const profilesApi = {
  /**
   * Get user profiles by IDs
   */
  async getByIds(userIds: string[]): Promise<{
    data: Array<{
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      permissions: UserPermission;
    }>;
  }> {
    return fetchApi<{
      data: Array<{
        id: string;
        display_name: string | null;
        avatar_url: string | null;
        permissions: UserPermission;
      }>;
    }>(`/api/profiles?ids=${userIds.join(',')}`);
  },

  /**
   * Get current user's profile
   * @param userId - Optional user ID for anonymous users
   */
  async get(userId?: string): Promise<{
    data: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      permissions?: UserPermission;
      created_at: string | null;
    };
  }> {
    const url = userId ? `/api/profile?user_id=${userId}` : '/api/profile';
    return fetchApi(url);
  },

  /**
   * Alias for get() - for backwards compatibility
   */
  async getCurrent(userId?: string): Promise<{
    data: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      permissions?: UserPermission;
      created_at: string | null;
    };
  }> {
    return profilesApi.get(userId);
  },

  /**
   * Update current user's profile
   */
  async update(profileData: {
    display_name?: string;
    avatar_url?: string;
    permissions?: UserPermission;
  }): Promise<{
    data: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      permissions: UserPermission;
      created_at: string | null;
    };
  }> {
    return fetchApi('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<{
    success: boolean;
    avatar_url: string;
    path: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/profile/avatar', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Avatar upload failed',
        response.status,
        data
      );
    }

    return data;
  },

  /**
   * Delete avatar image
   */
  async deleteAvatar(path: string): Promise<{ success: boolean }> {
    return fetchApi('/api/profile/avatar', {
      method: 'DELETE',
      body: JSON.stringify({ path }),
    });
  },

  /**
   * Fetch user profiles and return a Map of user IDs to display names
   */
  async getUserNamesMap(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) {
      return new Map();
    }

    try {
      const result = await this.getByIds(userIds);
      const profiles = result.data;

      const names = new Map<string, string>();

      // Map profiles to display names
      profiles.forEach(profile => {
        if (profile.display_name) {
          names.set(profile.id, profile.display_name);
        } else {
          names.set(profile.id, `User ${profile.id.substring(0, 8)}`);
        }
      });

      // For users without profiles, use fallback
      userIds.forEach(userId => {
        if (!names.has(userId)) {
          names.set(userId, `User ${userId.substring(0, 8)}`);
        }
      });

      return names;
    } catch (err) {
      console.error('Error fetching user profiles:', err);
      // Return fallback names for all users
      const fallbackNames = new Map<string, string>();
      userIds.forEach(userId => {
        fallbackNames.set(userId, `User ${userId.substring(0, 8)}`);
      });
      return fallbackNames;
    }
  },

  /**
   * Fetch user profiles and return Maps of user IDs to display names and avatars
   */
  async getUserProfilesMap(
    userIds: string[]
  ): Promise<{ names: Map<string, string>; avatars: Map<string, string> }> {
    if (userIds.length === 0) {
      return { names: new Map(), avatars: new Map() };
    }

    try {
      const result = await this.getByIds(userIds);
      const profiles = result.data;

      const names = new Map<string, string>();
      const avatars = new Map<string, string>();

      // Map profiles to display names and avatars
      profiles.forEach(profile => {
        if (profile.display_name) {
          names.set(profile.id, profile.display_name);
        } else {
          names.set(profile.id, `User ${profile.id.substring(0, 8)}`);
        }

        if (profile.avatar_url) {
          avatars.set(profile.id, profile.avatar_url);
        }
      });

      // For users without profiles, use fallback names
      userIds.forEach(userId => {
        if (!names.has(userId)) {
          names.set(userId, `User ${userId.substring(0, 8)}`);
        }
      });

      return { names, avatars };
    } catch (err) {
      console.error('Error fetching user profiles:', err);
      // Return fallback names for all users
      const fallbackNames = new Map<string, string>();
      userIds.forEach(userId => {
        fallbackNames.set(userId, `User ${userId.substring(0, 8)}`);
      });
      return { names: fallbackNames, avatars: new Map() };
    }
  },
};
