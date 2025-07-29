-- Check current state and completely reset teams table RLS policies
-- First, let's see what policies exist and drop them all
DO $$
BEGIN
    -- Drop all existing policies on teams table
    DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
    DROP POLICY IF EXISTS "Users can view their teams" ON teams;
    DROP POLICY IF EXISTS "Team owners can update teams" ON teams;
    DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
    DROP POLICY IF EXISTS "Team owners can update teams" ON teams;
END $$;

-- Ensure RLS is enabled
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create a very simple and permissive INSERT policy for testing
CREATE POLICY "Allow authenticated users to insert teams" 
ON teams FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create a simple SELECT policy
CREATE POLICY "Allow users to select their teams" 
ON teams FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid()
  )
);

-- Create UPDATE policy
CREATE POLICY "Allow team owners to update teams" 
ON teams FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'owner'
  )
);