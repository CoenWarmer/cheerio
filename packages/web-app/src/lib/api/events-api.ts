import { EventMember, Event } from '@/types/types';
import { fetchApi } from './api-client';

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
   * Join a event (add user as member)
   * @param eventId - Event slug or ID
   * @param userId - Optional user ID (for anonymous users)
   */
  async join(eventId: string, userId?: string) {
    return fetchApi<{
      success: boolean;
      alreadyMember?: boolean;
      member?: EventMember;
    }>(`/api/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },
};
