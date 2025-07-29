import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'https://esm.sh/date-fns-tz@3.0.0'
import { addDays, addMinutes, getDay, isAfter, isBefore } from 'https://esm.sh/date-fns@3.6.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TeamMember {
  id: string;
  display_name: string;
  timezone: string;
  working_blocks: WorkingBlock[];
  no_meeting_blocks: NoMeetingBlock[];
}

interface WorkingBlock {
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_minute: number; // minutes from midnight
  end_minute: number;
}

interface NoMeetingBlock {
  day_of_week: number;
  start_minute: number;
  end_minute: number;
}

interface Rules {
  duration_minutes: number;
  cadence: string;
  min_attendance_ratio: number;
  night_cap_per_week: number;
  prohibited_days: number[];
  required_member_ids: string[];
  rotation_enabled: boolean;
}

interface Suggestion {
  starts_at_utc: string;
  ends_at_utc: string;
  attending_member_ids: string[];
  overlap_ratio: number;
  fairness_score: number;
  penalties_json: {
    night_penalties: number;
    burden_penalties: number;
    adjacency_penalties: number;
  };
}

const PENALTY_WEIGHT = 0.1;
const FAIRNESS_DAYS = 28; // Look back period for fairness calculation

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function isInWorkingHours(member: TeamMember, dayOfWeek: number, startMinute: number, endMinute: number): boolean {
  const workingBlocks = member.working_blocks.filter(wb => wb.day_of_week === dayOfWeek);
  
  for (const block of workingBlocks) {
    // Check if meeting time overlaps with working hours
    if (startMinute >= block.start_minute && endMinute <= block.end_minute) {
      // Check if it conflicts with no-meeting blocks
      const conflicts = member.no_meeting_blocks.some(nmb => 
        nmb.day_of_week === dayOfWeek &&
        !(endMinute <= nmb.start_minute || startMinute >= nmb.end_minute)
      );
      
      if (!conflicts) {
        return true;
      }
    }
  }
  
  return false;
}

function isNightTime(utcTime: Date, timezone: string): boolean {
  try {
    const localTime = toZonedTime(utcTime, timezone);
    const hours = localTime.getHours();
    return hours < 7 || hours >= 21;
  } catch (error) {
    console.error(`Error converting timezone ${timezone}:`, error);
    return false;
  }
}

function isAdjacentToWorkingHours(member: TeamMember, dayOfWeek: number, startMinute: number, endMinute: number): boolean {
  const workingBlocks = member.working_blocks.filter(wb => wb.day_of_week === dayOfWeek);
  
  for (const block of workingBlocks) {
    // Check if meeting is within 30 minutes of work block start/end
    const isNearStart = Math.abs(startMinute - block.start_minute) <= 30;
    const isNearEnd = Math.abs(endMinute - block.end_minute) <= 30;
    
    if (isNearStart || isNearEnd) {
      return true;
    }
  }
  
  return false;
}

async function getRecentNightMeetings(supabase: any, teamId: string, memberIds: string[]): Promise<Record<string, number>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - FAIRNESS_DAYS);

  const { data: recentSuggestions } = await supabase
    .from('suggestions')
    .select('starts_at_utc, attending_member_ids')
    .eq('team_id', teamId)
    .gte('created_at', cutoffDate.toISOString());

  const nightCounts: Record<string, number> = {};
  memberIds.forEach(id => nightCounts[id] = 0);

  if (recentSuggestions) {
    for (const suggestion of recentSuggestions) {
      const meetingTime = new Date(suggestion.starts_at_utc);
      
      for (const memberId of suggestion.attending_member_ids) {
        // This is simplified - in reality we'd need to get member timezone
        // For now, assume we track night meetings count
        const member = memberIds.find(id => id === memberId);
        if (member) {
          nightCounts[memberId] = (nightCounts[memberId] || 0) + 1;
        }
      }
    }
  }

  return nightCounts;
}

function calculateFairnessScore(nightCounts: Record<string, number>): number {
  const counts = Object.values(nightCounts);
  if (counts.length === 0) return 1.0;
  
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);
  
  // Normalize to 0-1 scale (higher = more fair)
  return Math.max(0, 1 - (stdDev / (mean + 1)));
}

async function generateCandidateSlots(rules: Rules): Promise<Date[]> {
  const candidates: Date[] = [];
  const now = new Date();
  const endDate = addDays(now, 28);

  let currentDate = now;
  
  while (isBefore(currentDate, endDate)) {
    const dayOfWeek = getDay(currentDate);
    
    // Skip prohibited days
    if (rules.prohibited_days.includes(dayOfWeek)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // Generate 15-minute slots throughout the day
    for (let minute = 0; minute < 24 * 60; minute += 15) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(0, minute, 0, 0);
      
      // Skip past times
      if (isBefore(slotStart, now)) {
        continue;
      }
      
      const slotEnd = addMinutes(slotStart, rules.duration_minutes);
      
      // Ensure slot doesn't cross day boundary for simplicity
      if (slotEnd.getDate() !== slotStart.getDate()) {
        continue;
      }
      
      candidates.push(slotStart);
    }
    
    currentDate = addDays(currentDate, 1);
  }
  
  return candidates;
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

    const { teamId } = await req.json();
    
    if (!teamId) {
      throw new Error('Team ID is required');
    }

    console.log('Generating suggestions for team:', teamId);

    // Fetch team data
    const [rulesResult, membersResult] = await Promise.all([
      supabase
        .from('rules')
        .select('*')
        .eq('team_id', teamId)
        .single(),
      
      supabase
        .from('team_members')
        .select(`
          id,
          display_name,
          timezone,
          working_blocks (*),
          no_meeting_blocks (*)
        `)
        .eq('team_id', teamId)
    ]);

    if (rulesResult.error) throw rulesResult.error;
    if (membersResult.error) throw membersResult.error;

    const rules: Rules = rulesResult.data;
    const members: TeamMember[] = membersResult.data;

    console.log(`Found ${members.length} members and rules:`, rules);

    // Generate candidate slots
    const candidateSlots = await generateCandidateSlots(rules);
    console.log(`Generated ${candidateSlots.length} candidate slots`);

    // Get recent night meeting counts for fairness calculation
    const memberIds = members.map(m => m.id);
    const nightCounts = await getRecentNightMeetings(supabase, teamId, memberIds);

    const validSuggestions: Suggestion[] = [];

    // Evaluate each candidate slot
    for (const slotStart of candidateSlots.slice(0, 1000)) { // Limit for performance
      const slotEnd = addMinutes(slotStart, rules.duration_minutes);
      const dayOfWeek = getDay(slotStart);
      const startMinute = slotStart.getHours() * 60 + slotStart.getMinutes();
      const endMinute = slotEnd.getHours() * 60 + slotEnd.getMinutes();

      // Check member availability
      const availableMembers: string[] = [];
      
      for (const member of members) {
        if (isInWorkingHours(member, dayOfWeek, startMinute, endMinute)) {
          availableMembers.push(member.id);
        }
      }

      // Calculate overlap ratio
      const overlapRatio = availableMembers.length / members.length;
      
      // Filter: minimum attendance ratio
      if (overlapRatio < rules.min_attendance_ratio) {
        continue;
      }

      // Filter: required members must be available
      const hasAllRequired = rules.required_member_ids.every(reqId => 
        availableMembers.includes(reqId)
      );
      
      if (!hasAllRequired) {
        continue;
      }

      // Calculate penalties and bonuses
      let nightPenalties = 0;
      let adjacencyPenalties = 0;
      let burdenPenalties = 0;

      for (const member of members) {
        if (availableMembers.includes(member.id)) {
          // Night penalty
          if (isNightTime(slotStart, member.timezone)) {
            nightPenalties += PENALTY_WEIGHT;
          }

          // Adjacency penalty
          if (isAdjacentToWorkingHours(member, dayOfWeek, startMinute, endMinute)) {
            adjacencyPenalties += PENALTY_WEIGHT / 2;
          }

          // Burden penalty (for rotation)
          if (rules.rotation_enabled) {
            const memberNightCount = nightCounts[member.id] || 0;
            const avgNightCount = Object.values(nightCounts).reduce((a, b) => a + b, 0) / Object.keys(nightCounts).length;
            
            if (memberNightCount > avgNightCount) {
              burdenPenalties += PENALTY_WEIGHT; // Penalty for overburdened members
            }
          }
        }
      }

      // Calculate fairness score
      const fairnessScore = calculateFairnessScore(nightCounts);

      // Final score calculation
      const baseScore = overlapRatio;
      const totalPenalties = nightPenalties + adjacencyPenalties + burdenPenalties;
      const finalScore = baseScore - totalPenalties;

      const suggestion: Suggestion = {
        starts_at_utc: slotStart.toISOString(),
        ends_at_utc: slotEnd.toISOString(),
        attending_member_ids: availableMembers,
        overlap_ratio: overlapRatio,
        fairness_score: fairnessScore,
        penalties_json: {
          night_penalties: nightPenalties,
          burden_penalties: burdenPenalties,
          adjacency_penalties: adjacencyPenalties,
        }
      };

      validSuggestions.push(suggestion);
    }

    // Sort by score and take top 5
    validSuggestions.sort((a, b) => {
      const scoreA = a.overlap_ratio - (a.penalties_json.night_penalties + a.penalties_json.burden_penalties + a.penalties_json.adjacency_penalties);
      const scoreB = b.overlap_ratio - (b.penalties_json.night_penalties + b.penalties_json.burden_penalties + b.penalties_json.adjacency_penalties);
      return scoreB - scoreA;
    });

    const topSuggestions = validSuggestions.slice(0, 5);

    console.log(`Found ${topSuggestions.length} valid suggestions`);

    // Clear existing suggestions for this team
    await supabase
      .from('suggestions')
      .delete()
      .eq('team_id', teamId);

    // Insert new suggestions
    if (topSuggestions.length > 0) {
      const suggestionInserts = topSuggestions.map(suggestion => ({
        team_id: teamId,
        starts_at_utc: suggestion.starts_at_utc,
        ends_at_utc: suggestion.ends_at_utc,
        attending_member_ids: suggestion.attending_member_ids,
        overlap_ratio: suggestion.overlap_ratio,
        fairness_score: suggestion.fairness_score,
        penalties_json: suggestion.penalties_json,
        version: 1
      }));

      const { error: insertError } = await supabase
        .from('suggestions')
        .insert(suggestionInserts);

      if (insertError) {
        console.error('Error inserting suggestions:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestions: topSuggestions.length,
        data: topSuggestions 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-suggestions:', error);
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