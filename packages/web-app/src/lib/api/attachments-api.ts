import { ApiError } from './api-client';

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
    type: 'audio' | 'image' | 'video',
    userId?: string
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

    if (userId) {
      formData.append('user_id', userId);
    }

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
