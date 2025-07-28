import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TeamMember {
  display_name: string;
  timezone: string;
  email: string;
}

const sampleMembers: TeamMember[] = [
  { display_name: "Alex Chen", timezone: "America/Los_Angeles", email: "a***@company.com" },
  { display_name: "Sarah Johnson", timezone: "Europe/London", email: "s***@company.com" },
  { display_name: "Raj Patel", timezone: "Asia/Kolkata", email: "r***@company.com" },
  { display_name: "Kim Min-jun", timezone: "Asia/Seoul", email: "k***@company.com" }
];

// Working blocks: Monday-Friday 09:00-17:00 (540-1020 minutes)
const defaultWorkingBlocks = [
  { day_of_week: 1, start_minute: 540, end_minute: 1020 }, // Monday
  { day_of_week: 2, start_minute: 540, end_minute: 1020 }, // Tuesday
  { day_of_week: 3, start_minute: 540, end_minute: 1020 }, // Wednesday
  { day_of_week: 4, start_minute: 540, end_minute: 1020 }, // Thursday
  { day_of_week: 5, start_minute: 540, end_minute: 1020 }, // Friday
];

// No meeting blocks: Lunch 12:00-13:00 (720-780 minutes)
const defaultNoMeetingBlocks = [
  { day_of_week: 1, start_minute: 720, end_minute: 780 },
  { day_of_week: 2, start_minute: 720, end_minute: 780 },
  { day_of_week: 3, start_minute: 720, end_minute: 780 },
  { day_of_week: 4, start_minute: 720, end_minute: 780 },
  { day_of_week: 5, start_minute: 720, end_minute: 780 },
];

function generateSuggestions(teamId: string, memberIds: string[]) {
  const suggestions = [];
  const now = new Date();
  
  // Generate 5 sample suggestions for the next week
  for (let i = 0; i < 5; i++) {
    const baseDate = new Date(now);
    baseDate.setDate(now.getDate() + 1 + i); // Next 5 days
    baseDate.setHours(14 + (i % 3), 0, 0, 0); // Stagger times
    
    const endDate = new Date(baseDate);
    endDate.setMinutes(endDate.getMinutes() + 45); // 45 minute meetings
    
    // Simulate different overlap ratios and fairness scores
    const overlapRatio = 0.6 + (i * 0.1); // 0.6 to 1.0
    const fairnessScore = 0.7 + (i * 0.05); // 0.7 to 0.9
    
    // Randomly select 3-4 attendees
    const numAttendees = 3 + (i % 2);
    const attendingIds = memberIds.slice(0, numAttendees);
    
    suggestions.push({
      team_id: teamId,
      starts_at_utc: baseDate.toISOString(),
      ends_at_utc: endDate.toISOString(),
      attending_member_ids: attendingIds,
      overlap_ratio: overlapRatio,
      fairness_score: fairnessScore,
      penalties_json: {
        night_penalties: i % 2,
        burden_penalties: i * 0.1,
        adjacency_penalties: 0
      },
      version: 1
    });
  }
  
  return suggestions;
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

    console.log('Creating sample team...');

    // Check if sample team already exists
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('slug', 'sample-distributed-team')
      .single();

    let teamId: string;

    if (existingTeam) {
      console.log('Sample team already exists, using existing team');
      teamId = existingTeam.id;
    } else {
      // Create sample team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: 'Sample Distributed Team',
          slug: 'sample-distributed-team',
          default_timezone: 'UTC',
          locale: 'en'
        })
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        throw teamError;
      }

      teamId = team.id;
      console.log('Created team with ID:', teamId);

      // Create team members
      const memberInserts = sampleMembers.map(member => ({
        team_id: teamId,
        display_name: member.display_name,
        email: member.email,
        timezone: member.timezone,
        role: 'member' as const
      }));

      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .insert(memberInserts)
        .select();

      if (membersError) {
        console.error('Error creating members:', membersError);
        throw membersError;
      }

      console.log('Created members:', members.length);

      // Create working blocks for each member
      const workingBlocksInserts = [];
      const noMeetingBlocksInserts = [];

      for (const member of members) {
        for (const block of defaultWorkingBlocks) {
          workingBlocksInserts.push({
            member_id: member.id,
            ...block
          });
        }
        for (const block of defaultNoMeetingBlocks) {
          noMeetingBlocksInserts.push({
            member_id: member.id,
            ...block
          });
        }
      }

      // Insert working blocks
      const { error: workingBlocksError } = await supabase
        .from('working_blocks')
        .insert(workingBlocksInserts);

      if (workingBlocksError) {
        console.error('Error creating working blocks:', workingBlocksError);
        throw workingBlocksError;
      }

      // Insert no meeting blocks
      const { error: noMeetingBlocksError } = await supabase
        .from('no_meeting_blocks')
        .insert(noMeetingBlocksInserts);

      if (noMeetingBlocksError) {
        console.error('Error creating no meeting blocks:', noMeetingBlocksError);
        throw noMeetingBlocksError;
      }

      // Create rules
      const { error: rulesError } = await supabase
        .from('rules')
        .insert({
          team_id: teamId,
          duration_minutes: 45,
          cadence: 'weekly',
          min_attendance_ratio: 0.6,
          night_cap_per_week: 1,
          prohibited_days: [0, 6], // Sunday and Saturday
          required_member_ids: [],
          rotation_enabled: true
        });

      if (rulesError) {
        console.error('Error creating rules:', rulesError);
        throw rulesError;
      }

      console.log('Created working blocks, no meeting blocks, and rules');
    }

    // Get team members for suggestions
    const { data: members } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId);

    const memberIds = members?.map(m => m.id) || [];

    // Clear existing suggestions
    await supabase
      .from('suggestions')
      .delete()
      .eq('team_id', teamId);

    // Generate and insert suggestions
    const suggestions = generateSuggestions(teamId, memberIds);
    
    const { data: insertedSuggestions, error: suggestionsError } = await supabase
      .from('suggestions')
      .insert(suggestions)
      .select();

    if (suggestionsError) {
      console.error('Error creating suggestions:', suggestionsError);
      throw suggestionsError;
    }

    console.log('Created suggestions:', insertedSuggestions.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        teamId,
        suggestions: insertedSuggestions.length 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in create-sample-team:', error);
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