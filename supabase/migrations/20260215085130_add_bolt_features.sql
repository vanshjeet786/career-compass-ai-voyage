
-- Migration to add Bolt features to assessments table

ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS background_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Ensure RLS policies allow users to update their own assessments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'assessments' AND policyname = 'Users can update their own assessments'
    ) THEN
        CREATE POLICY "Users can update their own assessments"
        ON public.assessments
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
END $$;
