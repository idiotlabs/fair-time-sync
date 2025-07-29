import { supabase } from '@/integrations/supabase/client';

interface LogEventParams {
  eventType: 'member_added' | 'rules_updated' | 'suggestions_generated' | 'slot_exported' | 'share_link_created';
  teamId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export const logEvent = async ({ eventType, teamId, userId, metadata = {} }: LogEventParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('event_logs')
      .insert({
        event_type: eventType,
        team_id: teamId,
        user_id: userId || user?.id,
        metadata
      });

    if (error) {
      console.error('Error logging event:', error);
    }
  } catch (error) {
    console.error('Failed to log event:', error);
  }
};

export const getEventStats = async (teamId: string) => {
  try {
    const { data, error } = await supabase
      .from('event_logs')
      .select('event_type')
      .eq('team_id', teamId)
      .eq('event_type', 'suggestions_generated');

    if (error) throw error;

    return {
      suggestions_generated: data?.length || 0
    };
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return { suggestions_generated: 0 };
  }
};