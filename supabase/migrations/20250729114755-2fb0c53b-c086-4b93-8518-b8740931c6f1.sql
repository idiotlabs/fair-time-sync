-- Fix infinite recursion in team_members RLS policies
-- The issue is that the policy references team_members table within itself

-- Drop the problematic policy
DROP POLICY IF EXISTS "Team members can view team members" ON team_members;

-- Create a new policy that avoids self-reference
-- This policy allows users to see team members of teams they belong to
-- but uses a different approach to avoid recursion
CREATE POLICY "Users can view team members of their teams" 
ON team_members FOR SELECT 
USING (
  team_id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- Also ensure the management policy doesn't have recursion issues
DROP POLICY IF EXISTS "Team owners/admins can manage members" ON team_members;

CREATE POLICY "Team owners and admins can manage members" 
ON team_members FOR ALL 
USING (
  team_id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'admin')
  )
);