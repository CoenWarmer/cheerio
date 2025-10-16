import { supabase } from '@/lib/supabase';

export interface AnonymousProfile {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export const anonymousProfilesApi = {
  /**
   * Create a new anonymous profile
   */
  async create(
    displayName: string
  ): Promise<{ data: AnonymousProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('anonymous_profiles')
        .insert({
          display_name: displayName,
        })
        .select()
        .single();

      if (error) throw error;

      return { data: data as unknown as AnonymousProfile, error: null };
    } catch (error) {
      console.error('Error creating anonymous profile:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get an anonymous profile by ID
   */
  async get(
    id: string
  ): Promise<{ data: AnonymousProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('anonymous_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data: data as unknown as AnonymousProfile, error: null };
    } catch (error) {
      console.error('Error fetching anonymous profile:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Update an anonymous profile
   */
  async update(
    id: string,
    updates: { display_name?: string }
  ): Promise<{ data: AnonymousProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('anonymous_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: data as unknown as AnonymousProfile, error: null };
    } catch (error) {
      console.error('Error updating anonymous profile:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Delete an anonymous profile
   */
  async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('anonymous_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting anonymous profile:', error);
      return { error: error as Error };
    }
  },
};
