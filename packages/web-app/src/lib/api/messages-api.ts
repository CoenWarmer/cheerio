import { Attachment, Message } from '@/types/types';
import { fetchApi } from './api-client';

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
      user_id?: string;
    }
  ) {
    return fetchApi<{ data: Message }>(`/api/events/${eventId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },
};
