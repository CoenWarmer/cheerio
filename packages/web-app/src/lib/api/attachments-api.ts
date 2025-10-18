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
    // Determine filename extension based on blob type
    let filename = 'recording';
    if (file.type.includes('webm')) {
      filename = 'recording.webm';
    } else if (file.type.includes('mp4') || file.type.includes('m4a')) {
      filename = 'recording.m4a';
    } else if (file.type.includes('mpeg') || file.type.includes('mp3')) {
      filename = 'recording.mp3';
    } else if (file.type.includes('wav')) {
      filename = 'recording.wav';
    } else if (file.type.includes('ogg')) {
      filename = 'recording.ogg';
    } else {
      // Default to webm for unknown audio types
      filename = 'recording.webm';
    }

    const formData = new FormData();
    formData.append('file', file, filename);
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
