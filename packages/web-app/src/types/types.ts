import { Database } from '@/lib/database.types';

export type Event = Database['public']['Tables']['events']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Presence = Database['public']['Tables']['presence']['Row'];
export type EventMember = Database['public']['Tables']['event_members']['Row'];
export type Attachment =
  Database['public']['Tables']['messages']['Row']['attachment'];
