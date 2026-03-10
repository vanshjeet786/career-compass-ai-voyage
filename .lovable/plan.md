

## Fixes

### 1. Add `user_id` column to `background_info_history` table
The table exists but is missing the `user_id` column. Migration:
```sql
ALTER TABLE public.background_info_history 
ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add RLS policies
ALTER TABLE public.background_info_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own background info" ON public.background_info_history
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own background info" ON public.background_info_history
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own background info" ON public.background_info_history
FOR DELETE TO authenticated USING (user_id = auth.uid());
```

### 2. Fix TypeScript errors in `useBackgroundInfo.ts`
Cast through `unknown` for the `Json` → `BackgroundInfoData` conversion on lines 22, 37, 54:
```ts
return data as unknown as BackgroundInfoRecord | null;
return (data ?? []) as unknown as BackgroundInfoRecord[];
return data as unknown as BackgroundInfoRecord;
```

### 3. Update `src/integrations/supabase/types.ts`
The `background_info_history` table type already has `user_id` defined in the types file, so it matches the migration. No change needed there.

### Files modified
- **Migration**: Add `user_id` column + RLS policies
- **`src/hooks/useBackgroundInfo.ts`**: Fix 3 type casts

