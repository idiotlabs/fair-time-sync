import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Getting demo data...');

    // Get the sample team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, slug, default_timezone, locale')
      .eq('slug', 'sample-distributed-team')
      .single();

    if (teamError || !team) {
      console.error('Sample team not found:', teamError);
      return new Response(
        JSON.stringify({ error: 'Sample team not found. Please create it first.' }),
        { 
          status: 404,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get team members
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('id, display_name, email, timezone, role')
      .eq('team_id', team.id);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw membersError;
    }

    // Get suggestions
    const { data: suggestions, error: suggestionsError } = await supabase
      .from('suggestions')
      .select('*')
      .eq('team_id', team.id)
      .order('starts_at_utc')
      .limit(5);

    if (suggestionsError) {
      console.error('Error fetching suggestions:', suggestionsError);
      throw suggestionsError;
    }

    // Combine suggestions with member data
    const suggestionsWithMembers = suggestions?.map(suggestion => ({
      ...suggestion,
      attendingMembers: members?.filter(member => 
        suggestion.attending_member_ids.includes(member.id)
      ) || []
    })) || [];

    console.log('Successfully fetched demo data:', {
      team: team.name,
      members: members?.length || 0,
      suggestions: suggestions?.length || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        team,
        members,
        suggestions: suggestionsWithMembers
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-demo-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});