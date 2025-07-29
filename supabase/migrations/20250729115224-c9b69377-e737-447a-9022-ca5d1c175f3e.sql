-- Fix teams table RLS policies to allow team creation
-- The issue is that current SELECT policy requires team membership, 
-- but during team creation, the user isn't a member yet

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON teams;

-- Create new policies that work properly for team creation flow
-- Allow all authenticated users to create teams
CREATE POLICY "Authenticated users can create teams" 
ON teams FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view teams they are members of using security definer function
CREATE POLICY "Users can view their teams" 
ON teams FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tm.team_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- Allow team owners to update their teams
CREATE POLICY "Team owners can update teams" 
ON teams FOR UPDATE
TO authenticated
USING (public.user_can_manage_team(auth.uid(), id));

-- Note: We don't allow DELETE on teams for now, as it's a destructive operation
-- that should be handled through a special administrative process