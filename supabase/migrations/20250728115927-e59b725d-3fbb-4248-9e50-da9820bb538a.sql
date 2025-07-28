-- Create event_logs table for tracking core application events
CREATE TABLE public.event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_event_logs_type_created ON public.event_logs(event_type, created_at);
CREATE INDEX idx_event_logs_team_created ON public.event_logs(team_id, created_at);
CREATE INDEX idx_event_logs_user_created ON public.event_logs(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view events related to their teams
CREATE POLICY "Users can view team events" 
ON public.event_logs 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR
    team_id IN (
      SELECT t.id FROM teams t 
      JOIN team_members tm ON t.id = tm.team_id 
      WHERE tm.user_id = auth.uid()
    )
  )
);

-- Policy: Authenticated users can create events
CREATE POLICY "Users can create events" 
ON public.event_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Service role can manage all events (for system events)
CREATE POLICY "Service role can manage events" 
ON public.event_logs 
FOR ALL 
USING (true);