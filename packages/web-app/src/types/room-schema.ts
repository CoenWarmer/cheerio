/**
 * Expected Room Schema after migration
 * This file shows what your Room type will look like after running the migration
 * and regenerating types with `yarn supabase:types`
 */

export type RoomStatus = 'awaiting' | 'in_progress' | 'finished';

/**
 * Helper to get status display text
 */
export function getRoomStatusDisplay(status: RoomStatus): string {
  const statusMap: Record<RoomStatus, string> = {
    awaiting: 'Waiting to Start',
    in_progress: 'In Progress',
    finished: 'Finished',
  };
  return statusMap[status];
}

/**
 * Helper to get status color
 */
export function getRoomStatusColor(status: RoomStatus): string {
  const colorMap: Record<RoomStatus, string> = {
    awaiting: '#fbbf24', // yellow
    in_progress: '#10b981', // green
    finished: '#6b7280', // gray
  };
  return colorMap[status];
}

/**
 * Helper to check if room has started
 */
export function hasRoomStarted(startTime: string | null): boolean {
  if (!startTime) return false;
  return new Date(startTime) <= new Date();
}

/**
 * Helper to format start time
 */
export function formatStartTime(startTime: string | null): string {
  if (!startTime) return 'Not scheduled';

  const date = new Date(startTime);
  const now = new Date();

  if (date < now) {
    return `Started ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  } else {
    return `Starts ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  }
}
