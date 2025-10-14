import { supabase } from './supabase';

export const setPresence = async (roomId: string, userId: string) => {
  await supabase.from('presence').upsert(
    {
      room_id: roomId,
      user_id: userId,
      status: 'online',
      metadata: { platform: 'web' },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'room_id,user_id' }
  );
};

export const getPresence = async (roomId: string) => {
  const { data, error } = await supabase
    .from('presence')
    .select('*')
    .eq('room_id', roomId);
  if (error) {
    throw error;
  }
  return data;
};
