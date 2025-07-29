import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: '',
    })

    const { teamId } = await req.json()

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: 'Team ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating sample team data for team:', teamId)

    // Verify user has permission to create sample data for this team
    const { data: teamMember, error: memberError } = await supabaseClient
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', (await supabaseClient.auth.getUser()).data.user?.id)
      .single()

    if (memberError || !teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sample members with different timezones
    const sampleMembers = [
      { 
        name: 'Alice (PT)', 
        timezone: 'America/Los_Angeles', 
        email: 'alice@example.com' 
      },
      { 
        name: 'Bob (UTC)', 
        timezone: 'UTC', 
        email: 'bob@example.com' 
      },
      { 
        name: 'Charlie (IST)', 
        timezone: 'Asia/Kolkata', 
        email: 'charlie@example.com' 
      },
      { 
        name: 'Diana (KST)', 
        timezone: 'Asia/Seoul', 
        email: 'diana@example.com' 
      }
    ]

    const createdMembers = []

    // Create sample members
    for (const member of sampleMembers) {
      const { data: newMember, error: memberError } = await supabaseClient
        .from('team_members')
        .insert({
          team_id: teamId,
          display_name: member.name,
          email: member.email,
          role: 'member',
          timezone: member.timezone
        })
        .select()
        .single()

      if (memberError) {
        console.error('Error creating member:', memberError)
        throw memberError
      }

      createdMembers.push(newMember)

      // Create working blocks (Monday-Friday, 9:00-17:00)
      const workingBlocks = []
      for (let day = 1; day <= 5; day++) { // Monday to Friday
        workingBlocks.push({
          member_id: newMember.id,
          day_of_week: day,
          start_minute: 9 * 60, // 9:00 AM
          end_minute: 17 * 60   // 5:00 PM
        })
      }

      const { error: workingError } = await supabaseClient
        .from('working_blocks')
        .insert(workingBlocks)

      if (workingError) {
        console.error('Error creating working blocks:', workingError)
        throw workingError
      }

      // Create no-meeting blocks (Lunch break 12:00-13:00)
      const noMeetingBlocks = []
      for (let day = 1; day <= 5; day++) { // Monday to Friday
        noMeetingBlocks.push({
          member_id: newMember.id,
          day_of_week: day,
          start_minute: 12 * 60, // 12:00 PM
          end_minute: 13 * 60    // 1:00 PM
        })
      }

      const { error: noMeetingError } = await supabaseClient
        .from('no_meeting_blocks')
        .insert(noMeetingBlocks)

      if (noMeetingError) {
        console.error('Error creating no-meeting blocks:', noMeetingError)
        throw noMeetingError
      }

      console.log(`Created member ${member.name} with working and no-meeting blocks`)
    }

    // Create sample rules
    const { error: rulesError } = await supabaseClient
      .from('rules')
      .upsert({
        team_id: teamId,
        cadence: 'weekly',
        duration_minutes: 45,
        min_attendance_ratio: 0.6,
        night_cap_per_week: 1,
        prohibited_days: [0, 6], // Sunday and Saturday
        rotation_enabled: true,
        required_member_ids: []
      })

    if (rulesError) {
      console.error('Error creating rules:', rulesError)
      throw rulesError
    }

    console.log('Created sample rules')

    // Generate suggestions immediately
    console.log('Generating suggestions...')
    
    const { data: suggestionsData, error: suggestionsError } = await supabaseClient.functions.invoke('generate-suggestions', {
      body: { teamId }
    })

    if (suggestionsError) {
      console.error('Error generating suggestions:', suggestionsError)
      // Don't throw here, still return success for the sample data creation
    }

    const suggestionsCount = suggestionsData?.suggestions || 0
    console.log(`Generated ${suggestionsCount} suggestions`)

    // Log event
    const { error: logError } = await supabaseClient
      .from('event_logs')
      .insert({
        event_type: 'member_added',
        team_id: teamId,
        user_id: (await supabaseClient.auth.getUser()).data.user?.id,
        metadata: { 
          action: 'sample_team_created',
          members_count: createdMembers.length,
          suggestions_generated: suggestionsCount
        }
      })

    if (logError) {
      console.error('Error logging event:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        members: createdMembers.length,
        suggestions: suggestionsCount,
        message: `Sample team created with ${createdMembers.length} members and ${suggestionsCount} suggestions`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-sample-team function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})