import { supabase } from './supabase';

export const setPresence = async (eventId: string, userId: string) => {
  await supabase.from('presence').upsert(
    {
      event_id: eventId,
      user_id: userId,
      status: 'online',
      metadata: { platform: 'web' },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'event_id,user_id' }
  );
};

export const getPresence = async (eventId: string) => {
  const { data, error } = await supabase
    .from('presence')
    .select('*')
    .eq('event_id', eventId);
  if (error) {
    throw error;
  }
  return data;
};
