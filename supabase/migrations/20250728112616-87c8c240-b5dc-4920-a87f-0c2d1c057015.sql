-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member');

-- Create plan enum for billing
CREATE TYPE public.plan_type AS ENUM ('free', 'pro', 'team');

-- Create cadence enum for rules
CREATE TYPE public.cadence_type AS ENUM ('weekly', 'biweekly');

-- Create users table for profile data
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  locale TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  default_timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  role public.app_role NOT NULL DEFAULT 'member',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id),
  UNIQUE(team_id, email)
);

-- Create working_blocks table
CREATE TABLE public.working_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
  end_minute INTEGER NOT NULL CHECK (end_minute >= 0 AND end_minute <= 1440),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (start_minute < end_minute)
);

-- Create no_meeting_blocks table
CREATE TABLE public.no_meeting_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_minute INTEGER NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
  end_minute INTEGER NOT NULL CHECK (end_minute >= 0 AND end_minute <= 1440),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (start_minute < end_minute)
);

-- Create rules table
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  cadence public.cadence_type NOT NULL DEFAULT 'weekly',
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  min_attendance_ratio DECIMAL NOT NULL DEFAULT 0.6 CHECK (min_attendance_ratio >= 0.5 AND min_attendance_ratio <= 1.0),
  night_cap_per_week INTEGER NOT NULL DEFAULT 1 CHECK (night_cap_per_week >= 0),
  prohibited_days INTEGER[] DEFAULT '{}',
  required_member_ids TEXT[] DEFAULT '{}',
  rotation_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id)
);

-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  starts_at_utc TIMESTAMPTZ NOT NULL,
  ends_at_utc TIMESTAMPTZ NOT NULL,
  attending_member_ids TEXT[] NOT NULL DEFAULT '{}',
  fairness_score DECIMAL NOT NULL DEFAULT 0 CHECK (fairness_score >= 0 AND fairness_score <= 1),
  overlap_ratio DECIMAL NOT NULL DEFAULT 0 CHECK (overlap_ratio >= 0 AND overlap_ratio <= 1),
  penalties_json JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create share_links table
CREATE TABLE public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create billing_subscriptions table
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  plan public.plan_type NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id)
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_meeting_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for teams table
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update teams" ON public.teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid() AND tm.role = 'owner'
    )
  );

CREATE POLICY "Authenticated users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for team_members table
CREATE POLICY "Team members can view team members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners/admins can manage members" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Create RLS policies for working_blocks table
CREATE POLICY "Team members can view working blocks" ON public.working_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = working_blocks.member_id 
      AND EXISTS (
        SELECT 1 FROM public.team_members tm2 
        WHERE tm2.team_id = tm.team_id AND tm2.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can manage their own working blocks" ON public.working_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = working_blocks.member_id AND tm.user_id = auth.uid()
    )
  );

-- Create RLS policies for no_meeting_blocks table
CREATE POLICY "Team members can view no meeting blocks" ON public.no_meeting_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = no_meeting_blocks.member_id 
      AND EXISTS (
        SELECT 1 FROM public.team_members tm2 
        WHERE tm2.team_id = tm.team_id AND tm2.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can manage their own no meeting blocks" ON public.no_meeting_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.id = no_meeting_blocks.member_id AND tm.user_id = auth.uid()
    )
  );

-- Create RLS policies for rules table
CREATE POLICY "Team members can view rules" ON public.rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = rules.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners/admins can manage rules" ON public.rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = rules.team_id AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Create RLS policies for suggestions table
CREATE POLICY "Team members can view suggestions" ON public.suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = suggestions.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners/admins can manage suggestions" ON public.suggestions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = suggestions.team_id AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Create RLS policies for share_links table
CREATE POLICY "Team owners/admins can manage share links" ON public.share_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = share_links.team_id AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Create RLS policies for billing_subscriptions table
CREATE POLICY "Team owners can view billing" ON public.billing_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = billing_subscriptions.team_id AND tm.user_id = auth.uid() 
      AND tm.role = 'owner'
    )
  );

CREATE POLICY "Team owners can manage billing" ON public.billing_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = billing_subscriptions.team_id AND tm.user_id = auth.uid() 
      AND tm.role = 'owner'
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_working_blocks_updated_at BEFORE UPDATE ON public.working_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_no_meeting_blocks_updated_at BEFORE UPDATE ON public.no_meeting_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_share_links_updated_at BEFORE UPDATE ON public.share_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_subscriptions_updated_at BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();