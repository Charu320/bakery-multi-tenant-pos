-- Migration: Add outlet_id to app_settings table to support outlet-specific GST settings

-- Ensure get_user_outlet_id function exists (from previous migration)
CREATE OR REPLACE FUNCTION public.get_user_outlet_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT outlet_id 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add outlet_id column to app_settings
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE;

-- Create unique constraint: one settings record per outlet
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_outlet_id_unique 
ON public.app_settings(outlet_id) 
WHERE outlet_id IS NOT NULL;

-- Migrate existing data: if there's a global settings row, duplicate it for all outlets
DO $$
DECLARE
  outlet_record RECORD;
  global_settings RECORD;
BEGIN
  -- Get the global settings (where outlet_id IS NULL)
  SELECT * INTO global_settings 
  FROM public.app_settings 
  WHERE outlet_id IS NULL 
  LIMIT 1;

  -- If global settings exist, create settings for each outlet
  IF global_settings IS NOT NULL THEN
    FOR outlet_record IN SELECT id FROM public.outlets LOOP
      -- Check if settings already exist for this outlet
      IF NOT EXISTS (
        SELECT 1 FROM public.app_settings WHERE outlet_id = outlet_record.id
      ) THEN
        INSERT INTO public.app_settings (gst_enabled, gst_percentage, outlet_id)
        VALUES (
          global_settings.gst_enabled,
          global_settings.gst_percentage,
          outlet_record.id
        );
      END IF;
    END LOOP;
  END IF;
END $$;

-- Update RLS policies to filter by outlet_id
DROP POLICY IF EXISTS "Allow authenticated read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow admin update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow admin insert app_settings" ON public.app_settings;

-- READ: Users can read settings for their outlet (or global if no outlet_id)
CREATE POLICY "Allow authenticated read app_settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  -- Admin can see all settings
  (auth.jwt()->'user_metadata'->>'role' = 'admin')
  OR
  -- Manager/Kitchen can see settings for their outlet
  (
    auth.jwt()->'user_metadata'->>'role' IN ('manager', 'kitchen')
    AND outlet_id = public.get_user_outlet_id()
  )
  OR
  -- Global settings (outlet_id IS NULL) - accessible to all
  (outlet_id IS NULL)
);

-- INSERT: Admin can insert settings for any outlet
CREATE POLICY "Allow admin insert app_settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);

-- UPDATE: Admin can update settings for any outlet
CREATE POLICY "Allow admin update app_settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
)
WITH CHECK (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);
