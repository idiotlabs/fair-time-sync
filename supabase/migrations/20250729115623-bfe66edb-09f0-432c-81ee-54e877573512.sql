-- Fix team_members INSERT policy to allow team creation bootstrap
-- The issue: users can't add themselves as the first member of a new team
-- because they're not yet a team manager

-- Drop the current INSERT policy
DROP POLICY IF EXISTS "Team managers can insert members safely" ON team_members;

-- Create a new INSERT policy that allows:
-- 1. Team managers to add members (existing functionality)
-- 2. Users to add themselves as the first member when creating a team
CREATE POLICY "Allow team creation and member management"
ON team_members FOR INSERT
WITH CHECK (
  -- Case 1: User is already a team manager (existing teams)
  public.user_can_manage_team(auth.uid(), team_id)
  OR
  -- Case 2: User is adding themselves as the first member (new team)
  (
    user_id = auth.uid() 
    AND role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id
    )
  )
);