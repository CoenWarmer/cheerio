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

export async function fetchApi<T>(
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
