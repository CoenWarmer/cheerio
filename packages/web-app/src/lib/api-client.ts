/**
 * API Client for making requests to Next.js API routes
 */

import {
  Attachment,
  Message,
  Presence,
  Event,
  EventMember,
} from '@/types/types';
import type { UserPermission } from '@/types/permissions';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: Event | Message | Presence | EventMember | Attachment
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data
    );
  }

  return data;
}

/**
 * Events API
 */
export const eventsApi = {
  /**
   * Get all events
   */
  async getAll() {
    return fetchApi<{ data: Event[] }>('/api/events');
  },

  /**
   * Get a single event by ID
   */
  async getById(id: string) {
    return fetchApi<{ data: Event }>(`/api/events/${id}`);
  },

  /**
   * Create a new event
   */
  async create(eventData: {
    name: string;
    description?: string | null;
    donation_link?: string | null;
    start_time?: string | null;
    status?: 'awaiting' | 'in_progress' | 'finished';
    is_private?: boolean;
    created_by: string;
    location?: { lat: number; long: number } | null;
  }) {
    return fetchApi<{ data: Event }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  /**
   * Join a event (add current user as member)
   */
  async join(eventId: string) {
    return fetchApi<{
      success: boolean;
      alreadyMember?: boolean;
      member?: EventMember;
    }>(`/api/events/${eventId}/join`, {
      method: 'POST',
    });
  },
};

/**
 * Messages API
 */
export const messagesApi = {
  /**
   * Get messages for a event
   */
  async getByEventId(eventId: string) {
    return fetchApi<{ data: Message[] }>(`/api/events/${eventId}/messages`);
  },

  /**
   * Create a new message in a event
   */
  async create(
    eventId: string,
    messageData: {
      content: string;
      attachment?: Attachment;
      location?: { lat: number; long: number };
    }
  ) {
    return fetchApi<{ data: Message }>(`/api/events/${eventId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },
};

/**
 * Attachments API
 */
export const attachmentsApi = {
  /**
   * Upload an attachment file
   */
  async upload(
    file: Blob,
    eventId: string,
    type: 'audio' | 'image' | 'video'
  ): Promise<{
    success: boolean;
    attachment: {
      type: string;
      url: string;
      filename: string;
      mimeType: string;
      size: number;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file, `recording.webm`);
    formData.append('eventId', eventId);
    formData.append('type', type);

    const response = await fetch('/api/attachments/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'Upload failed', response.status, data);
    }

    return data;
  },
};

/**
 * Presence API
 */
export const presenceApi = {
  /**
   * Update user presence in a event
   */
  async update(eventId: string, status: 'online' | 'away' = 'online') {
    return fetchApi<{ success: boolean; presence: Presence }>(
      `/api/events/${eventId}/presence`,
      {
        method: 'POST',
        body: JSON.stringify({ status }),
      }
    );
  },

  /**
   * Get active users in a event
   */
  async getActive(eventId: string) {
    return fetchApi<{ data: Presence[]; count: number }>(
      `/api/events/${eventId}/presence`
    );
  },

  /**
   * Remove user presence from a event
   */
  async remove(eventId: string) {
    return fetchApi<{ success: boolean }>(`/api/events/${eventId}/presence`, {
      method: 'DELETE',
    });
  },
};

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
   */
  async getCurrent(): Promise<{
    data: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      permissions: UserPermission;
      created_at: string | null;
    };
  }> {
    return fetchApi('/api/profile');
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

/**
 * Event Members API
 */
export interface EventMemberWithProfile {
  user_id: string;
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
  permissions: 'admin' | 'tracker' | 'supporter';
}

export const eventMembersApi = {
  /**
   * Get all members of a event with their profiles
   */
  async getByEventSlug(
    eventSlug: string
  ): Promise<{ data: EventMemberWithProfile[] }> {
    return fetchApi<{ data: EventMemberWithProfile[] }>(
      `/api/events/${eventSlug}/members`
    );
  },
};
