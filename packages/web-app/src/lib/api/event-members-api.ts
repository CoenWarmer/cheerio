import { fetchApi } from './api-client';

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
