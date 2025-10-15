/**
 * Types for user activity tracking in rooms
 */

export type ActivityType =
  | 'location'
  | 'speed'
  | 'distance'
  | 'music'
  | 'tracking';

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

/**
 * Combined tracking activity that includes location, speed, and distance
 * This reduces API calls by consolidating all tracking data into one request
 */
export interface TrackingActivity {
  lat: number;
  long: number;
  accuracy?: number;
  timestamp?: number;
  speed?: number; // km/h
  distance?: number; // total distance in km
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
  | MusicActivity
  | TrackingActivity;

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
