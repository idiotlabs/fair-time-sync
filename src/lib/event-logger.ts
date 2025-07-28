import { supabase } from '@/integrations/supabase/client';

export type EventType = 
  | 'team_created'
  | 'member_added'
  | 'rules_updated'
  | 'suggestions_generated'
  | 'slot_exported'
  | 'share_link_created';

interface LogEventParams {
  eventType: EventType;
  teamId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an application event to the database
 */
export async function logEvent({ eventType, teamId, metadata = {} }: LogEventParams) {
  try {
    const { error } = await supabase
      .from('event_logs')
      .insert({
        event_type: eventType,
        team_id: teamId,
        metadata
      });

    if (error) {
      console.error('Failed to log event:', { eventType, teamId, error });
      return false;
    }

    console.log('Event logged:', { eventType, teamId, metadata });
    return true;
  } catch (error) {
    console.error('Error logging event:', error);
    return false;
  }
}

/**
 * Get recent events for a team
 */
export async function getTeamEvents(teamId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('event_logs')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching team events:', error);
    return [];
  }
}

/**
 * Get events by type
 */
export async function getEventsByType(eventType: EventType, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('event_logs')
      .select('*')
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching events by type:', error);
    return [];
  }
}

/**
 * Get user activity events
 */
export async function getUserEvents(limit = 50) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('event_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user events:', error);
    return [];
  }
}