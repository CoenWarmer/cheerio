import { Presence } from '@/types/types';
import { fetchApi } from './api-client';

/**
 * Presence API
 */
export const presenceApi = {
  /**
   * Update user presence in a event
   * @param eventId - Event slug
   * @param status - Presence status
   * @param userId - Optional user ID for anonymous users
   */
  async update(
    eventId: string,
    status: 'online' | 'away' = 'online',
    userId?: string
  ) {
    return fetchApi<{ success: boolean; presence: Presence }>(
      `/api/events/${eventId}/presence`,
      {
        method: 'POST',
        body: JSON.stringify({ status, user_id: userId }),
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
   * @param eventId - Event slug
   * @param userId - Optional user ID for anonymous users
   */
  async remove(eventId: string, userId?: string) {
    return fetchApi<{ success: boolean }>(`/api/events/${eventId}/presence`, {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId }),
    });
  },
};
