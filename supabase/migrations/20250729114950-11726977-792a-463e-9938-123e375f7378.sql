-- Create security definer function to check user team membership without recursion
CREATE OR REPLACE FUNCTION public.user_has_team_access(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.user_id = _user_id 
    AND tm.team_id = _team_id
  );
$$;

-- Create security definer function to check if user can manage team
CREATE OR REPLACE FUNCTION public.user_can_manage_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.user_id = _user_id 
    AND tm.team_id = _team_id
    AND tm.role IN ('owner', 'admin')
  );
$$;

-- Drop all existing policies on team_members to start fresh
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Team owners and admins can manage members" ON team_members;

-- Create new safe policies using security definer functions
CREATE POLICY "Users can view team members safely"
ON team_members FOR SELECT
USING (public.user_has_team_access(auth.uid(), team_id));

CREATE POLICY "Team managers can insert members safely"
ON team_members FOR INSERT
WITH CHECK (public.user_can_manage_team(auth.uid(), team_id));

CREATE POLICY "Team managers can update members safely"
ON team_members FOR UPDATE
USING (public.user_can_manage_team(auth.uid(), team_id));

CREATE POLICY "Team managers can delete members safely"
ON team_members FOR DELETE
USING (public.user_can_manage_team(auth.uid(), team_id));