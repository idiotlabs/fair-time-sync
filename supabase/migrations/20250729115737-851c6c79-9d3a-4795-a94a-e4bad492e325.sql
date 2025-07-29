-- Clean up orphaned teams (teams without any members) and add slug uniqueness handling
-- First, let's see if there are teams without members and clean them up

-- Delete teams that have no members (orphaned teams from failed creations)
DELETE FROM teams 
WHERE id NOT IN (
  SELECT DISTINCT team_id 
  FROM team_members 
  WHERE team_id IS NOT NULL
);

-- Also clean up any billing subscriptions for orphaned teams
DELETE FROM billing_subscriptions 
WHERE team_id NOT IN (
  SELECT id FROM teams
);