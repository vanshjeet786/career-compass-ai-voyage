-- Create background_info_history table for standalone background info management
CREATE TABLE IF NOT EXISTS public.background_info_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  background_info JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast "current info" lookup (most recent row per user)
CREATE INDEX idx_background_info_user_created
  ON public.background_info_history (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.background_info_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own background info"
  ON public.background_info_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own background info"
  ON public.background_info_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own background info"
  ON public.background_info_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own background info"
  ON public.background_info_history FOR DELETE
  USING (auth.uid() = user_id);

-- Migrate existing background_info from assessments into history table
-- Takes the latest non-null background_info per user as their current info
INSERT INTO public.background_info_history (user_id, background_info, created_at)
SELECT DISTINCT ON (a.user_id)
  a.user_id,
  a.background_info,
  COALESCE(a.started_at, a.created_at, NOW())
FROM public.assessments a
WHERE a.background_info IS NOT NULL
  AND a.background_info != '{}'::jsonb
ORDER BY a.user_id, a.started_at DESC;
