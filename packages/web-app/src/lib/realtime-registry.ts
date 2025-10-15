/**
 * Global registry to prevent duplicate Realtime subscriptions
 *
 * This ensures that only one subscription exists per channel,
 * even if a component re-renders or is mounted multiple times
 * (e.g., React Strict Mode in development)
 */

import type { RealtimeChannel } from '@supabase/supabase-js';

class RealtimeRegistry {
  private channels = new Map<string, RealtimeChannel>();
  private subscribers = new Map<string, number>();

  /**
   * Get or create a channel subscription
   * @param channelKey Unique identifier for the channel
   * @param createChannel Function to create the channel if it doesn't exist
   * @returns The channel instance
   */
  getOrCreateChannel(
    channelKey: string,
    createChannel: () => RealtimeChannel
  ): RealtimeChannel {
    if (!this.channels.has(channelKey)) {
      const channel = createChannel();
      this.channels.set(channelKey, channel);
      this.subscribers.set(channelKey, 0);
    }

    // Increment subscriber count
    const count = this.subscribers.get(channelKey)!;
    this.subscribers.set(channelKey, count + 1);

    return this.channels.get(channelKey)!;
  }

  /**
   * Unsubscribe from a channel
   * Only removes the channel when all subscribers have unsubscribed
   * @param channelKey Unique identifier for the channel
   * @param removeChannel Function to remove the channel
   */
  unsubscribe(
    channelKey: string,
    removeChannel: (channel: RealtimeChannel) => void
  ) {
    const count = this.subscribers.get(channelKey);
    if (count === undefined) return;

    const newCount = count - 1;

    if (newCount <= 0) {
      // Last subscriber, remove the channel
      const channel = this.channels.get(channelKey);
      if (channel) {
        removeChannel(channel);
        this.channels.delete(channelKey);
        this.subscribers.delete(channelKey);
      }
    } else {
      // Still have subscribers, just decrement
      this.subscribers.set(channelKey, newCount);
    }
  }

  /**
   * Get current subscriber count for a channel (useful for debugging)
   */
  getSubscriberCount(channelKey: string): number {
    return this.subscribers.get(channelKey) ?? 0;
  }

  /**
   * Get all active channels (useful for debugging)
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Export a singleton instance
export const realtimeRegistry = new RealtimeRegistry();
