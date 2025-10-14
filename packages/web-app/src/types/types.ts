import { Database } from '@/lib/database.types';

export type Room = Database['public']['Tables']['rooms']['Row']; // Will be typed from API response
export type Message = Database['public']['Tables']['messages']['Row'];
export type Presence = Database['public']['Tables']['presence']['Row'];
export type RoomMember = Database['public']['Tables']['room_members']['Row'];
export type Attachment =
  Database['public']['Tables']['messages']['Row']['attachment'];
