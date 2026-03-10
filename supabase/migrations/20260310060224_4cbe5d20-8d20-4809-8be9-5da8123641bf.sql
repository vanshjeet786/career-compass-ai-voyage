ALTER TABLE public.background_info_history 
ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.background_info_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own background info" ON public.background_info_history
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own background info" ON public.background_info_history
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own background info" ON public.background_info_history
FOR DELETE TO authenticated USING (user_id = auth.uid());