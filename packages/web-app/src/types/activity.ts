/**
 * Types for user activity tracking in rooms
 */

export type ActivityType = 'location' | 'speed' | 'distance' | 'music';

export interface LocationActivity {
  lat: number;
  long: number;
  accuracy?: number;
  timestamp?: number;
}

export interface SpeedActivity {
  speed: number; // km/h or mph
  unit: 'kmh' | 'mph';
}

export interface DistanceActivity {
  distance: number; // total distance traveled
  unit: 'km' | 'miles';
}

export interface MusicActivity {
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  service?: 'spotify' | 'apple' | 'manual';
}

export type ActivityData =
  | LocationActivity
  | SpeedActivity
  | DistanceActivity
  | MusicActivity;

export interface UserActivity {
  id: string;
  user_id: string;
  room_id: string;
  activity_type: ActivityType;
  data: ActivityData;
  created_at: string;
}

export interface CreateActivityInput {
  activity_type: ActivityType;
  data: ActivityData;
}

export interface ActivityFilters {
  activity_type?: ActivityType;
  user_id?: string;
  since?: string; // ISO timestamp
  limit?: number;
}
