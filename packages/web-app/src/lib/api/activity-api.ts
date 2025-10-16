/**
 * Client-side API wrapper for user activity operations
 */

import type {
  UserActivity,
  CreateActivityInput,
  ActivityFilters,
} from '@/types/activity';
import { fetchApi } from './api-client';

export const activityApi = {
  /**
   * Get activity history for a event
   */
  async getActivities(
    eventSlug: string,
    filters?: ActivityFilters
  ): Promise<{ data: UserActivity[] }> {
    const params = new URLSearchParams();

    if (filters?.activity_type) {
      params.append('activity_type', filters.activity_type);
    }
    if (filters?.user_id) {
      params.append('user_id', filters.user_id);
    }
    if (filters?.since) {
      params.append('since', filters.since);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const query = params.toString();
    const url = `/api/events/${eventSlug}/activity${query ? `?${query}` : ''}`;

    return fetchApi<{ data: UserActivity[] }>(url);
  },

  /**
   * Create a new activity entry
   */
  async createActivity(
    eventSlug: string,
    activity: CreateActivityInput
  ): Promise<{ data: UserActivity }> {
    return fetchApi<{ data: UserActivity }>(
      `/api/events/${eventSlug}/activity`,
      {
        method: 'POST',
        body: JSON.stringify(activity),
      }
    );
  },

  /**
   * Get current user's journey in a event
   */
  async getMyJourney(eventSlug: string): Promise<{
    data: {
      activities: UserActivity[];
      summary: {
        total_activities: number;
        location_points: number;
        total_distance: number;
        max_speed: number;
        songs_played: number;
        start_time: string | null;
        last_update: string | null;
      };
    };
  }> {
    return fetchApi(`/api/events/${eventSlug}/activity/my-journey`);
  },
};
