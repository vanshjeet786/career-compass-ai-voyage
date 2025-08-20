-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_layer INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for assessments
CREATE POLICY "Users can view own assessments" ON public.assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON public.assessments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create assessment responses table
CREATE TABLE IF NOT EXISTS public.assessment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  layer_number INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  response_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment responses
CREATE POLICY "Users can view own assessment responses" ON public.assessment_responses
  FOR SELECT USING (assessment_id IN (
    SELECT id FROM public.assessments WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own assessment responses" ON public.assessment_responses
  FOR INSERT WITH CHECK (assessment_id IN (
    SELECT id FROM public.assessments WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own assessment responses" ON public.assessment_responses
  FOR UPDATE USING (assessment_id IN (
    SELECT id FROM public.assessments WHERE user_id = auth.uid()
  ));

-- Create assessment results table
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  intelligence_scores JSONB DEFAULT '{}',
  personality_insights JSONB DEFAULT '{}',
  career_recommendations JSONB DEFAULT '[]',
  ai_explanations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment results
CREATE POLICY "Users can view own assessment results" ON public.assessment_results
  FOR SELECT USING (assessment_id IN (
    SELECT id FROM public.assessments WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own assessment results" ON public.assessment_results
  FOR INSERT WITH CHECK (assessment_id IN (
    SELECT id FROM public.assessments WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own assessment results" ON public.assessment_results
  FOR UPDATE USING (assessment_id IN (
    SELECT id FROM public.assessments WHERE user_id = auth.uid()
  ));

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();